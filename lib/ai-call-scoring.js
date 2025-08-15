// AI Call Scoring & Performance Analytics
// Analyzes calls in real-time and provides performance metrics

import OpenAI from 'openai';

class AICallScoring {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.scoringCriteria = {
      greeting: { weight: 10, max: 10 },
      rapport: { weight: 15, max: 10 },
      discovery: { weight: 20, max: 10 },
      presentation: { weight: 20, max: 10 },
      objectionHandling: { weight: 15, max: 10 },
      closing: { weight: 20, max: 10 },
      professionalism: { weight: 10, max: 10 },
      enthusiasm: { weight: 10, max: 10 },
      clarity: { weight: 10, max: 10 },
      listening: { weight: 15, max: 10 }
    };
    
    this.realTimeMetrics = new Map();
  }

  // Analyze call in real-time
  async analyzeCall(callId, transcript, metadata = {}) {
    try {
      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate sales coach analyzing agent calls.
            Score the following aspects on a scale of 1-10:
            - Greeting: Professional opening, company introduction
            - Rapport: Building connection, finding common ground
            - Discovery: Asking qualifying questions, understanding needs
            - Presentation: Property features, benefits, value proposition
            - Objection Handling: Addressing concerns, providing solutions
            - Closing: Asking for commitment, next steps
            - Professionalism: Tone, language, courtesy
            - Enthusiasm: Energy, passion, confidence
            - Clarity: Clear communication, avoiding jargon
            - Listening: Active listening, acknowledging customer
            
            Also identify:
            - Key moments (positive and negative)
            - Missed opportunities
            - Compliance issues
            - Training recommendations`
          },
          {
            role: 'user',
            content: `Analyze this call transcript:\n\n${transcript}`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });

      const scores = JSON.parse(analysis.choices[0].message.content);
      
      // Calculate overall score
      const overallScore = this.calculateOverallScore(scores);
      
      // Generate performance insights
      const insights = this.generateInsights(scores, transcript);
      
      // Track metrics over time
      this.updateAgentMetrics(metadata.agentId, overallScore, scores);
      
      return {
        callId,
        timestamp: new Date(),
        agent: metadata.agentName || 'Unknown',
        duration: metadata.duration || 0,
        scores,
        overallScore,
        grade: this.getGrade(overallScore),
        insights,
        improvements: this.getImprovementAreas(scores),
        strengths: this.getStrengths(scores),
        coachingNotes: this.generateCoachingNotes(scores, insights),
        complianceCheck: this.checkCompliance(transcript),
        sentimentAnalysis: await this.analyzeSentiment(transcript)
      };
      
    } catch (error) {
      console.error('Call scoring error:', error);
      return null;
    }
  }

  // Calculate weighted overall score
  calculateOverallScore(scores) {
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const [criterion, config] of Object.entries(this.scoringCriteria)) {
      const score = scores[criterion] || 0;
      totalScore += (score / config.max) * config.weight;
      totalWeight += config.weight;
    }
    
    return Math.round((totalScore / totalWeight) * 100);
  }

  // Get letter grade
  getGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'C+';
    if (score >= 65) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  // Generate performance insights
  generateInsights(scores, transcript) {
    const insights = [];
    
    // Analyze each scoring area
    if (scores.greeting < 7) {
      insights.push({
        type: 'improvement',
        area: 'Greeting',
        message: 'Consider a more engaging opening that includes your name and company',
        priority: 'medium'
      });
    }
    
    if (scores.discovery < 7) {
      insights.push({
        type: 'improvement',
        area: 'Discovery',
        message: 'Ask more qualifying questions to understand customer needs better',
        priority: 'high'
      });
    }
    
    if (scores.closing < 7) {
      insights.push({
        type: 'improvement',
        area: 'Closing',
        message: 'Be more direct in asking for commitment and scheduling next steps',
        priority: 'high'
      });
    }
    
    if (scores.listening > 8) {
      insights.push({
        type: 'strength',
        area: 'Listening',
        message: 'Excellent active listening demonstrated',
        priority: 'low'
      });
    }
    
    // Check for specific patterns
    if (transcript.toLowerCase().includes('um') || transcript.toLowerCase().includes('uh')) {
      const fillerCount = (transcript.match(/\b(um|uh|like|you know)\b/gi) || []).length;
      if (fillerCount > 5) {
        insights.push({
          type: 'improvement',
          area: 'Clarity',
          message: `Reduce filler words (${fillerCount} detected). Practice speaking more confidently`,
          priority: 'medium'
        });
      }
    }
    
    return insights;
  }

  // Get improvement areas
  getImprovementAreas(scores) {
    return Object.entries(scores)
      .filter(([_, score]) => score < 7)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3)
      .map(([area, score]) => ({
        area: this.formatAreaName(area),
        score,
        recommendation: this.getRecommendation(area, score)
      }));
  }

  // Get strength areas
  getStrengths(scores) {
    return Object.entries(scores)
      .filter(([_, score]) => score >= 8)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area, score]) => ({
        area: this.formatAreaName(area),
        score
      }));
  }

  // Generate personalized coaching notes
  generateCoachingNotes(scores, insights) {
    const notes = [];
    
    // Overall performance
    const avgScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.values(scores).length;
    
    if (avgScore >= 8) {
      notes.push('Excellent call! Keep maintaining this high standard.');
    } else if (avgScore >= 6) {
      notes.push('Good call with room for improvement in key areas.');
    } else {
      notes.push('Focus on fundamentals and practice core skills.');
    }
    
    // Specific coaching
    if (scores.discovery < 7 && scores.closing < 7) {
      notes.push('Work on the consultation process: Ask better questions early to make closing easier.');
    }
    
    if (scores.enthusiasm < 7) {
      notes.push('Increase energy level - your enthusiasm is contagious and affects buyer confidence.');
    }
    
    if (scores.objectionHandling < 7) {
      notes.push('Practice common objection responses. Prepare scripts for typical concerns.');
    }
    
    return notes;
  }

  // Check compliance
  checkCompliance(transcript) {
    const compliance = {
      passed: true,
      issues: [],
      warnings: []
    };
    
    // Check for required disclosures
    if (!transcript.toLowerCase().includes('oakmont') && !transcript.toLowerCase().includes('realty')) {
      compliance.warnings.push('Company name not mentioned');
    }
    
    // Check for prohibited phrases
    const prohibited = ['guarantee', 'risk-free', 'no risk', 'definitely sell'];
    prohibited.forEach(phrase => {
      if (transcript.toLowerCase().includes(phrase)) {
        compliance.passed = false;
        compliance.issues.push(`Prohibited phrase used: "${phrase}"`);
      }
    });
    
    // Check for required information
    if (transcript.length > 1000 && !transcript.toLowerCase().includes('appointment')) {
      compliance.warnings.push('Long call without attempting to schedule appointment');
    }
    
    return compliance;
  }

  // Analyze sentiment
  async analyzeSentiment(transcript) {
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Analyze the sentiment of this conversation. Return JSON with: customerSentiment (positive/neutral/negative), agentSentiment, overallTone, emotionalJourney (array of sentiment changes)'
          },
          {
            role: 'user',
            content: transcript
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3
      });
      
      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        customerSentiment: 'unknown',
        agentSentiment: 'unknown',
        overallTone: 'unknown',
        emotionalJourney: []
      };
    }
  }

  // Update agent metrics over time
  updateAgentMetrics(agentId, score, detailedScores) {
    if (!agentId) return;
    
    if (!this.realTimeMetrics.has(agentId)) {
      this.realTimeMetrics.set(agentId, {
        callCount: 0,
        totalScore: 0,
        averageScore: 0,
        scores: [],
        improvements: [],
        strengths: [],
        trend: 'stable'
      });
    }
    
    const metrics = this.realTimeMetrics.get(agentId);
    metrics.callCount++;
    metrics.totalScore += score;
    metrics.averageScore = Math.round(metrics.totalScore / metrics.callCount);
    metrics.scores.push({ score, timestamp: new Date(), details: detailedScores });
    
    // Calculate trend (last 5 calls)
    if (metrics.scores.length >= 5) {
      const recent = metrics.scores.slice(-5);
      const recentAvg = recent.reduce((a, b) => a + b.score, 0) / 5;
      const previousAvg = metrics.scores.slice(-10, -5).reduce((a, b) => a + b.score, 0) / 5;
      
      if (recentAvg > previousAvg + 2) metrics.trend = 'improving';
      else if (recentAvg < previousAvg - 2) metrics.trend = 'declining';
      else metrics.trend = 'stable';
    }
    
    return metrics;
  }

  // Get agent performance report
  getAgentReport(agentId) {
    const metrics = this.realTimeMetrics.get(agentId);
    if (!metrics) return null;
    
    return {
      agentId,
      totalCalls: metrics.callCount,
      averageScore: metrics.averageScore,
      grade: this.getGrade(metrics.averageScore),
      trend: metrics.trend,
      lastCall: metrics.scores[metrics.scores.length - 1],
      bestCall: metrics.scores.reduce((a, b) => a.score > b.score ? a : b),
      worstCall: metrics.scores.reduce((a, b) => a.score < b.score ? a : b),
      consistencyScore: this.calculateConsistency(metrics.scores),
      improvementRate: this.calculateImprovementRate(metrics.scores)
    };
  }

  // Calculate consistency
  calculateConsistency(scores) {
    if (scores.length < 2) return 100;
    
    const values = scores.map(s => s.score);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Convert to 0-100 scale (lower std dev = higher consistency)
    return Math.max(0, Math.round(100 - (stdDev * 2)));
  }

  // Calculate improvement rate
  calculateImprovementRate(scores) {
    if (scores.length < 5) return 0;
    
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    
    const firstAvg = firstHalf.reduce((a, b) => a + b.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b.score, 0) / secondHalf.length;
    
    return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
  }

  // Get recommendation for improvement
  getRecommendation(area, score) {
    const recommendations = {
      greeting: 'Practice a confident 3-second introduction: "Hi [Name], this is [Your Name] from [Your Company]"',
      rapport: 'Find common ground early - ask about their property goals or local area interests',
      discovery: 'Use the BANT framework: Budget, Authority, Need, Timeline',
      presentation: 'Focus on benefits, not features. How does this solve their problem?',
      objectionHandling: 'Acknowledge, empathize, then reframe. Never argue or dismiss concerns',
      closing: 'Use assumptive close: "When would be the best time for you to view the property?"',
      professionalism: 'Maintain consistent tone, avoid slang, speak clearly',
      enthusiasm: 'Smile while speaking - it comes through in your voice. Show genuine interest',
      clarity: 'Pause between thoughts. Avoid industry jargon. Confirm understanding',
      listening: 'Wait 2 seconds after they finish before responding. Take notes'
    };
    
    return recommendations[area] || 'Focus on continuous improvement in this area';
  }

  // Format area name for display
  formatAreaName(area) {
    return area.replace(/([A-Z])/g, ' $1').trim()
      .replace(/^./, str => str.toUpperCase());
  }

  // Generate team leaderboard
  async getTeamLeaderboard() {
    const leaderboard = [];
    
    for (const [agentId, metrics] of this.realTimeMetrics.entries()) {
      leaderboard.push({
        agentId,
        name: await this.getAgentName(agentId),
        score: metrics.averageScore,
        calls: metrics.callCount,
        trend: metrics.trend,
        grade: this.getGrade(metrics.averageScore)
      });
    }
    
    return leaderboard.sort((a, b) => b.score - a.score);
  }

  // Get agent name (placeholder - connect to your user system)
  async getAgentName(agentId) {
    const agents = {
      '22965049': 'Terence Houhoutas',
      'fadi': 'Fadi',
      'christina': 'Christina Zahra',
      'admin': 'Admin'
    };
    return agents[agentId] || `Agent ${agentId}`;
  }
}

// Singleton instance
let scoringInstance = null;

export const getAICallScoring = () => {
  if (!scoringInstance) {
    scoringInstance = new AICallScoring();
  }
  return scoringInstance;
};

export default AICallScoring;