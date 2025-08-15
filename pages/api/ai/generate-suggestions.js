export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript } = req.body;

  try {
    // Use Ollama for AI suggestions
    const aiResult = await generateOllamaSuggestions(transcript);
    
    res.status(200).json({
      success: true,
      suggestions: aiResult.suggestions,
      response: aiResult.response
    });
  } catch (error) {
    console.error('Ollama AI suggestion error:', error);
    
    // Fallback to rule-based suggestions if Ollama fails
    const suggestions = generateRealEstateSuggestions(transcript);
    const response = generateAIResponse(transcript);

    res.status(200).json({
      success: true,
      suggestions,
      response: response + " (Local AI processing)"
    });
  }
}

async function generateOllamaSuggestions(transcript) {
  try {
    const prompt = `You are an expert real estate AI assistant actively coaching during a LIVE phone call. 

CONVERSATION SO FAR: "${transcript}"

IMPORTANT: This is an ONGOING conversation. The client is still on the call. Generate FRESH, CONTEXTUAL suggestions based on the ENTIRE conversation flow, not just the last sentence.

Provide 4 DIFFERENT suggestions that:
1. Move the conversation FORWARD (don't repeat what's been said)
2. Build on what's been discussed
3. Address any unresolved points
4. Guide toward next actions

CRITICAL: Keep the momentum going! Every response should advance the sale.

You must respond with ONLY valid JSON in this exact format:
{
  "suggestions": [
    "Positive acknowledgment that reframes their concern",
    "Solution-focused question that moves forward", 
    "Confidence-building statement about opportunities",
    "Action-oriented next step"
  ],
  "response": "Upbeat insight that sees the positive potential in this conversation"
}

GOLDEN RULES - NEVER BREAK THESE:
- ALWAYS stay positive and optimistic, no matter what they say
- Turn every objection into an opportunity 
- Focus on solutions, not problems
- Build confidence and excitement about possibilities
- Keep momentum toward viewings, meetings, or next steps
- Use Australian real estate context
- Keep responses under 15 words each
- End conversations on a high note

Examples of HUMAN-CENTERED responses:
Client: "This is too expensive" 
→ SALES: "Let me show you similar value in your comfort zone"
→ HUMAN: "I hear you - let's find something that feels right financially"
→ PERSONAL: "Your financial peace of mind is my priority"

Client: "I'm not sure about this"
→ SALES: "Let me address your specific concerns"  
→ HUMAN: "That's completely normal - this is a big decision"
→ PERSONAL: "Take all the time you need - I'm here when you're ready"

Client: "I need to think about it"
→ SALES: "What specific information would help your decision?"
→ HUMAN: "Absolutely - important decisions deserve proper thought"
→ PERSONAL: "I respect that - let's reconnect when it feels right for you"

Client: "My spouse disagrees"
→ SALES: "Let's find common ground that works for both of you"
→ HUMAN: "Family harmony is so important in these decisions"
→ PERSONAL: "I understand - you're a team and need to be aligned"

Client: "I'm overwhelmed"
→ SALES: "Let me simplify this process for you"
→ HUMAN: "I hear you - let's take this one step at a time"
→ PERSONAL: "Your wellbeing matters more than any sale - let's pause if you need"

BALANCE YOUR RESPONSES:
- 40% Human empathy and understanding
- 30% Personal connection and care
- 30% Gentle sales progression
- NEVER pushy, ALWAYS supportive

Remember: People buy from people they trust and like. Be that person.`;

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llama3.2',
        prompt,
        stream: false,
        options: {
          temperature: 0.5, // Slightly higher for more variety in ongoing conversation
          num_predict: 400,
          top_p: 0.9,
          repeat_penalty: 1.3, // Higher to avoid repetitive suggestions
          seed: Date.now() // Different seed each time for fresh suggestions
        }
      }),
      signal: AbortSignal.timeout(5000) // 5 second timeout for faster responses
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw Ollama response:', data.response);
    
    // Clean up the response - remove any markdown formatting
    let cleanedResponse = data.response.trim();
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '');
    }
    
    try {
      const aiResponse = JSON.parse(cleanedResponse);
      
      // Validate the response structure
      if (!aiResponse.suggestions || !Array.isArray(aiResponse.suggestions) || aiResponse.suggestions.length !== 4) {
        throw new Error('Invalid suggestions format');
      }
      
      return {
        suggestions: aiResponse.suggestions.filter(s => s && s.length > 5),
        response: aiResponse.response || "Continue building rapport with the client"
      };
    } catch (parseError) {
      console.error('JSON parsing failed:', parseError);
      console.error('Cleaned response:', cleanedResponse);
      // If JSON parsing fails, extract suggestions from raw text
      return parseRawOllamaResponse(cleanedResponse);
    }
  } catch (error) {
    console.error('Ollama request failed:', error);
    throw error;
  }
}

function parseRawOllamaResponse(rawText) {
  // Try to extract suggestions from raw text if JSON parsing fails
  const suggestions = [];
  const lines = rawText.split('\n');
  
  lines.forEach(line => {
    if (line.includes('suggestion') || line.startsWith('-') || line.startsWith('*')) {
      const cleaned = line.replace(/^[-*]\s*/, '').replace(/suggestion\d+:?\s*/i, '').trim();
      if (cleaned.length > 10 && cleaned.length < 100) {
        suggestions.push(cleaned);
      }
    }
  });

  return {
    suggestions: suggestions.slice(0, 4),
    response: "Ollama is analyzing your conversation to provide insights..."
  };
}

function generateRealEstateSuggestions(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('budget') || text.includes('price') || text.includes('afford')) {
    return [
      "What's your maximum budget for this property?",
      "Are you pre-approved for financing?",
      "Would you like to discuss payment options?",
      "Let me show you properties in your price range"
    ];
  }
  
  if (text.includes('location') || text.includes('area') || text.includes('suburb')) {
    return [
      "What areas are you most interested in?",
      "How important is proximity to schools?",
      "Do you need access to public transport?",
      "I can show you similar properties nearby"
    ];
  }
  
  if (text.includes('bedroom') || text.includes('room') || text.includes('space')) {
    return [
      "How many bedrooms do you need?",
      "Is outdoor space important to you?",
      "Do you need a home office?",
      "What's your ideal living arrangement?"
    ];
  }
  
  if (text.includes('viewing') || text.includes('inspection') || text.includes('see')) {
    return [
      "Would you like to schedule a viewing?",
      "I have availability this weekend",
      "Should I arrange a private inspection?",
      "Let me check available viewing times"
    ];
  }
  
  // Default suggestions for general inquiries
  return [
    "Tell me more about what you're looking for",
    "What's most important to you in a property?",
    "Are you a first-time buyer?",
    "Would you like to see some options?"
  ];
}

function generateAIResponse(transcript) {
  const text = transcript.toLowerCase();
  
  if (text.includes('hello') || text.includes('hi')) {
    return "Great opening! Build rapport by asking about their property needs.";
  }
  
  if (text.includes('budget') || text.includes('price')) {
    return "Good! Understanding budget helps qualify the lead. Ask about financing next.";
  }
  
  if (text.includes('location')) {
    return "Location is key in real estate. Follow up with lifestyle preferences.";
  }
  
  if (text.includes('bedroom') || text.includes('room')) {
    return "Size requirements noted. Consider asking about future family plans.";
  }
  
  if (text.includes('thank')) {
    return "Excellent service approach! Consider following up with next steps.";
  }
  
  return "Keep the conversation focused on their property needs and timeline.";
}