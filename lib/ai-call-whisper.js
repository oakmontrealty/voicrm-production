// AI Call Whisper - Real-time call assistance
import { Configuration, OpenAIApi } from 'openai';

class AICallWhisper {
  constructor() {
    this.openai = null;
    this.isActive = false;
    this.conversationContext = [];
    this.agentProfile = null;
    this.propertyContext = null;
    this.suggestionsCallback = null;
  }

  initialize() {
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = new OpenAIApi(configuration);
    }
  }

  // Start whisper session for a call
  startSession(agentProfile, propertyContext = null) {
    this.isActive = true;
    this.agentProfile = agentProfile;
    this.propertyContext = propertyContext;
    this.conversationContext = [];
    
    console.log('Call Whisper session started for agent:', agentProfile.name);
  }

  // Process real-time transcription and provide suggestions
  async processTranscription(speaker, text) {
    if (!this.isActive || !this.openai) return null;

    // Add to conversation context
    this.conversationContext.push({
      speaker,
      text,
      timestamp: new Date()
    });

    // Keep last 10 exchanges for context
    if (this.conversationContext.length > 20) {
      this.conversationContext = this.conversationContext.slice(-20);
    }

    // Only provide suggestions for customer statements
    if (speaker === 'customer') {
      const suggestion = await this.generateSuggestion(text);
      
      if (this.suggestionsCallback) {
        this.suggestionsCallback(suggestion);
      }
      
      return suggestion;
    }

    return null;
  }

  // Generate AI suggestion based on conversation
  async generateSuggestion(customerText) {
    try {
      const recentContext = this.conversationContext.slice(-6)
        .map(c => `${c.speaker}: ${c.text}`)
        .join('\n');

      const prompt = `You are an AI assistant helping a real estate agent during a live call.

Current conversation:
${recentContext}

Customer just said: "${customerText}"

Property context: ${this.propertyContext ? JSON.stringify(this.propertyContext) : 'General inquiry'}

Provide a brief, actionable suggestion for the agent to respond. Include:
1. Key point to address
2. Suggested response (keep it natural and brief)
3. Any relevant property/market data to mention
4. Objection handling if needed

Format as JSON: { point, response, data, tip }`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a real estate sales expert providing real-time assistance." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      const suggestion = JSON.parse(completion.data.choices[0].message.content);
      
      return {
        ...suggestion,
        confidence: this.calculateConfidence(customerText),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error generating suggestion:', error);
      return {
        point: 'Listen actively',
        response: 'Continue with natural conversation',
        tip: 'Focus on understanding their needs',
        error: true
      };
    }
  }

  // Calculate confidence score for suggestion
  calculateConfidence(text) {
    // Simple heuristic based on question indicators
    const questionIndicators = ['?', 'what', 'when', 'where', 'how', 'why', 'could', 'would', 'should'];
    const hasQuestion = questionIndicators.some(indicator => 
      text.toLowerCase().includes(indicator)
    );
    
    const objectionKeywords = ['expensive', 'high', 'concern', 'worry', 'not sure', 'think about'];
    const hasObjection = objectionKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );

    if (hasQuestion) return 0.9;
    if (hasObjection) return 0.95;
    return 0.7;
  }

  // Detect key moments in conversation
  detectKeyMoments(text) {
    const keyMoments = {
      priceDiscussion: /price|cost|afford|budget|expensive|cheap/i.test(text),
      appointmentIntent: /visit|see|inspect|viewing|appointment|meet|available/i.test(text),
      objection: /but|however|concern|worry|not sure|think about/i.test(text),
      buyingSignal: /interested|like|love|perfect|when can|how soon/i.test(text),
      competitorMention: /other agent|another property|also looking|comparing/i.test(text)
    };

    return Object.entries(keyMoments)
      .filter(([, detected]) => detected)
      .map(([type]) => type);
  }

  // Generate post-call summary and next steps
  async generateCallSummary() {
    if (!this.openai || this.conversationContext.length === 0) return null;

    try {
      const fullConversation = this.conversationContext
        .map(c => `${c.speaker}: ${c.text}`)
        .join('\n');

      const prompt = `Analyze this real estate call and provide:
1. Brief summary (2-3 sentences)
2. Customer interest level (1-10)
3. Key objections raised
4. Commitments made
5. Recommended next steps
6. Follow-up message suggestion

Conversation:
${fullConversation}

Format as JSON.`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are analyzing a real estate sales call." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      return JSON.parse(completion.data.choices[0].message.content);
    } catch (error) {
      console.error('Error generating summary:', error);
      return null;
    }
  }

  // End whisper session
  endSession() {
    this.isActive = false;
    const summary = this.generateCallSummary();
    this.conversationContext = [];
    return summary;
  }

  // Set callback for real-time suggestions
  onSuggestion(callback) {
    this.suggestionsCallback = callback;
  }
}

// Real-time suggestion display component
export class WhisperDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentSuggestion = null;
  }

  showSuggestion(suggestion) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="whisper-suggestion ${suggestion.error ? 'error' : 'active'}">
        <div class="whisper-header">
          <span class="whisper-title">💡 AI Suggestion</span>
          <span class="confidence">${Math.round((suggestion.confidence || 0.5) * 100)}% confidence</span>
        </div>
        <div class="whisper-content">
          <div class="key-point">
            <strong>Address:</strong> ${suggestion.point}
          </div>
          <div class="suggested-response">
            <strong>Say:</strong> "${suggestion.response}"
          </div>
          ${suggestion.data ? `
            <div class="supporting-data">
              <strong>Mention:</strong> ${suggestion.data}
            </div>
          ` : ''}
          ${suggestion.tip ? `
            <div class="pro-tip">
              <strong>Tip:</strong> ${suggestion.tip}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    // Auto-hide after 10 seconds
    setTimeout(() => this.hideSuggestion(), 10000);
  }

  hideSuggestion() {
    if (this.container) {
      this.container.classList.add('fade-out');
      setTimeout(() => {
        this.container.innerHTML = '';
        this.container.classList.remove('fade-out');
      }, 300);
    }
  }
}

// Singleton instance
let whisperInstance = null;

export const getCallWhisper = () => {
  if (!whisperInstance) {
    whisperInstance = new AICallWhisper();
    whisperInstance.initialize();
  }
  return whisperInstance;
};

export default AICallWhisper;