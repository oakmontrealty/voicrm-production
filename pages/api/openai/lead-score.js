import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { lead, interactions, properties } = req.body;

  if (!lead) {
    return res.status(400).json({ error: 'Lead data is required' });
  }

  try {
    // Prepare context for AI analysis
    const context = {
      lead_info: lead,
      interaction_history: interactions || [],
      properties_viewed: properties || [],
      company_info: {
        name: 'Real Estate Agency',
        market: 'Australian Real Estate',
        average_deal_size: '$750,000',
      },
    };

    // Get AI-powered lead scoring
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `You are an expert real estate lead scoring AI. Analyze leads and provide:
            1. Lead Score (0-100)
            2. Conversion Probability (percentage)
            3. Recommended Actions (list)
            4. Best Properties to Show (based on profile)
            5. Risk Factors (what might lose the deal)
            6. Engagement Level (Cold/Warm/Hot)
            7. Estimated Timeline to Close
            8. Budget Range Prediction
            9. Communication Preferences
            10. Personality Profile (for better rapport)`,
        },
        {
          role: 'user',
          content: `Analyze this lead and provide comprehensive scoring:\n${JSON.stringify(context, null, 2)}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    // Generate personalized engagement strategy
    const strategy = await generateEngagementStrategy(analysis, lead);

    // Predict optimal contact times
    const contactTimes = predictOptimalContactTimes(lead, interactions);

    res.status(200).json({
      success: true,
      scoring: {
        ...analysis,
        engagement_strategy: strategy,
        optimal_contact_times: contactTimes,
        analysis_timestamp: new Date().toISOString(),
        confidence_level: calculateConfidence(interactions),
      },
    });
  } catch (error) {
    console.error('Lead scoring error:', error);
    res.status(500).json({
      error: 'Failed to score lead',
      message: error.message,
    });
  }
}

async function generateEngagementStrategy(analysis, lead) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'Generate a personalized engagement strategy for real estate leads. Include specific talking points, property recommendations, and communication tactics.',
      },
      {
        role: 'user',
        content: `Create engagement strategy for: ${JSON.stringify({ analysis, lead })}`,
      },
    ],
    temperature: 0.5,
  });

  return response.choices[0].message.content;
}

function predictOptimalContactTimes(lead, interactions) {
  // Analyze past interaction patterns
  const times = interactions?.map(i => new Date(i.created_at).getHours()) || [];
  
  // Default optimal times for real estate
  const defaults = {
    weekday_morning: '9:00 AM - 11:00 AM',
    weekday_evening: '5:30 PM - 7:30 PM',
    saturday: '10:00 AM - 2:00 PM',
    sunday: '1:00 PM - 4:00 PM',
  };

  // Adjust based on interaction history
  if (times.length > 0) {
    const avgHour = Math.round(times.reduce((a, b) => a + b) / times.length);
    defaults.preferred_time = `${avgHour}:00 - ${avgHour + 2}:00`;
  }

  return defaults;
}

function calculateConfidence(interactions) {
  const base = 50;
  const interactionBonus = Math.min((interactions?.length || 0) * 5, 30);
  const recencyBonus = interactions?.length > 0 && 
    new Date() - new Date(interactions[0].created_at) < 7 * 24 * 60 * 60 * 1000 ? 20 : 0;
  
  return Math.min(base + interactionBonus + recencyBonus, 100);
}