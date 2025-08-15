import OpenAI from 'openai';
import formidable from 'formidable';
import fs from 'fs';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse the incoming form data
    const form = formidable({ multiples: false });
    
    const [fields, files] = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve([fields, files]);
      });
    });

    const audioFile = files.audio;
    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Transcribe with Whisper
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioFile.filepath),
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      prompt: 'This is a business call for a real estate company.',
    });

    // Analyze the transcription with GPT-4
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a real estate CRM. Analyze this call transcription and provide:
            1. Summary (2-3 sentences)
            2. Key Points (bullet points)
            3. Action Items (what needs to be done)
            4. Sentiment (Positive/Neutral/Negative)
            5. Lead Score (0-100 based on interest level)
            6. Property Requirements (if mentioned)
            7. Follow-up Recommendations`,
        },
        {
          role: 'user',
          content: `Analyze this call transcript: "${transcription.text}"`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(analysis.choices[0].message.content);

    // Extract entities for CRM
    const entities = await extractEntities(transcription.text);

    // Clean up temp file
    fs.unlinkSync(audioFile.filepath);

    res.status(200).json({
      success: true,
      transcription: {
        text: transcription.text,
        duration: transcription.duration,
        language: transcription.language,
        segments: transcription.segments,
      },
      analysis: result,
      entities: entities,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({
      error: 'Failed to transcribe audio',
      message: error.message,
    });
  }
}

// Extract entities like names, phone numbers, addresses
async function extractEntities(text) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'Extract entities from this text. Return JSON with: names, phone_numbers, emails, addresses, property_types, price_ranges, dates',
        },
        {
          role: 'user',
          content: text,
        },
      ],
      temperature: 0,
      response_format: { type: 'json_object' },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error('Entity extraction error:', error);
    return {};
  }
}