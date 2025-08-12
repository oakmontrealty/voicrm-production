import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '../../../lib/supabase'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { audio, userId } = req.body

    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // Create a File object for OpenAI
    const audioFile = new File([audioBuffer], 'audio.webm', { type: 'audio/webm' })

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: 'en',
      prompt: 'Australian real estate conversation with names, phone numbers, and property addresses',
    })

    // Parse the transcription for contact info
    const parsed = parseContactInfo(transcription.text)

    // If we found contact info, create the contact
    if (parsed.name && parsed.phone) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          name: parsed.name,
          phone_number: parsed.phone,
          email: parsed.email,
          source: 'voice_command',
          status: 'lead',
          user_id: userId,
        })
        .select()
        .single()

      if (!contactError) {
        // Log the voice command
        await supabase.from('voice_commands').insert({
          user_id: userId,
          command_text: transcription.text,
          parsed_data: parsed,
          action_type: 'create_contact',
          status: 'processed',
        })

        // Analyze with GPT-4 if it's a longer conversation
        if (transcription.text.length > 100) {
          const analysis = await analyzeConversation(transcription.text)
          
          await supabase.from('ai_analysis').insert({
            contact_id: contact.id,
            transcript: transcription.text,
            ...analysis,
          })

          // Update contact with insights
          await supabase.from('contacts').update({
            lead_score: analysis.lead_score,
            urgency_level: analysis.urgency_level,
            budget_range: analysis.budget_range,
            property_interests: analysis.property_interests,
          }).eq('id', contact.id)
        }

        return res.status(200).json({
          success: true,
          transcription: transcription.text,
          contact,
          parsed,
        })
      }
    }

    // Even if no contact was created, return the transcription
    res.status(200).json({
      success: true,
      transcription: transcription.text,
      parsed,
      message: 'Transcription successful, but no contact info detected',
    })

  } catch (error: any) {
    console.error('Transcription error:', error)
    res.status(500).json({ error: error.message })
  }
}

function parseContactInfo(text: string) {
  // Enhanced parsing for Australian context
  const namePattern = /(?:name is |I'm |this is |my name's? )([A-Z][a-z]+ [A-Z][a-z]+)/i
  const phonePattern = /(?:0[2-9]\d{8}|04\d{8}|\+61[2-9]\d{8}|\+614\d{8})/
  const emailPattern = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/
  
  // Try comma-separated format first
  const parts = text.split(',').map(p => p.trim())
  if (parts.length >= 2) {
    return {
      name: parts[0],
      phone: parts[1].replace(/\D/g, ''),
      email: parts[2] || null,
    }
  }

  // Try pattern matching
  const nameMatch = text.match(namePattern)
  const phoneMatch = text.match(phonePattern)
  const emailMatch = text.match(emailPattern)

  return {
    name: nameMatch ? nameMatch[1] : null,
    phone: phoneMatch ? phoneMatch[0].replace(/\D/g, '') : null,
    email: emailMatch ? emailMatch[1] : null,
  }
}

async function analyzeConversation(transcript: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are analyzing a real estate conversation. Extract:
            1. lead_score: number 1-10 (10 being highest quality lead)
            2. urgency_level: "low" | "medium" | "high" | "urgent"
            3. sentiment: "positive" | "neutral" | "negative"
            4. budget_range: string (e.g., "$500k-$700k")
            5. property_interests: array of strings (e.g., ["3 bedroom", "near schools"])
            6. key_topics: array of main discussion points
            7. next_actions: array of recommended follow-up actions
            Return as JSON.`,
        },
        {
          role: 'user',
          content: transcript,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Analysis error:', error)
    return {
      lead_score: 5,
      urgency_level: 'medium',
      sentiment: 'neutral',
      budget_range: null,
      property_interests: [],
      key_topics: [],
      next_actions: ['Follow up with property options'],
    }
  }
}