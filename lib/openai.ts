import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function transcribeAudio(audioFile: File): Promise<string> {
  try {
    const formData = new FormData()
    formData.append('file', audioFile)
    formData.append('model', 'whisper-1')
    formData.append('language', 'en')
    formData.append('prompt', 'Australian real estate conversation with names, phone numbers, and property addresses')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData,
    })

    const data = await response.json()
    return data.text
  } catch (error) {
    console.error('Transcription error:', error)
    throw error
  }
}

export async function analyzeConversation(transcript: string) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant analyzing real estate conversations. Extract the following information:
            1. Contact details (name, phone, email)
            2. Property interests (type, location, budget)
            3. Urgency level (low/medium/high/urgent)
            4. Lead score (1-10)
            5. Sentiment (positive/neutral/negative)
            6. Next actions recommended
            7. Key topics discussed
            Return as JSON.`
        },
        {
          role: 'user',
          content: transcript
        }
      ],
      temperature: 0.3,
    })

    return JSON.parse(completion.choices[0].message.content || '{}')
  } catch (error) {
    console.error('Analysis error:', error)
    throw error
  }
}

export async function generateEmailDraft(context: any) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a professional real estate agent drafting personalized follow-up emails.'
        },
        {
          role: 'user',
          content: `Create a follow-up email based on: ${JSON.stringify(context)}`
        }
      ],
      temperature: 0.7,
    })

    return completion.choices[0].message.content
  } catch (error) {
    console.error('Email generation error:', error)
    throw error
  }
}

export default openai