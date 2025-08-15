// AI Coaching Brain - Intelligent agent coaching and development system
// Provides real-time coaching, personalized training plans, and performance optimization

import OpenAI from 'openai';
import { getAICallScoring } from './ai-call-scoring';

class AICoachingBrain {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.callScoring = getAICallScoring();
    this.agentProfiles = new Map();
    this.coachingInterventions = new Map();
    this.trainingPlans = new Map();
    this.skillCategories = new Map();
    
    this.skillFramework = {
      communication: {
        name: 'Communication Skills',
        weight: 25,
        subskills: {
          clarity: 'Speaking clearly and concisely',
          listening: 'Active listening and comprehension',
          empathy: 'Understanding and relating to customers',
          persuasion: 'Influencing and convincing abilities'
        }
      },
      sales: {
        name: 'Sales Techniques',
        weight: 30,
        subskills: {
          discovery: 'Qualifying and needs analysis',
          presentation: 'Product/service presentation skills',
          objection_handling: 'Overcoming customer concerns',
          closing: 'Securing commitments and next steps'
        }
      },
      product_knowledge: {
        name: 'Product Knowledge',
        weight: 20,
        subskills: {
          properties: 'Local market and property expertise',
          processes: 'Sales and legal process knowledge',
          pricing: 'Market pricing and valuation skills',
          competition: 'Competitive landscape awareness'
        }
      },
      professionalism: {
        name: 'Professionalism',
        weight: 15,
        subskills: {
          punctuality: 'Time management and reliability',
          ethics: 'Ethical behavior and compliance',
          appearance: 'Professional presentation',
          follow_through: 'Commitment execution'
        }
      },
      technology: {
        name: 'Technology Adoption',
        weight: 10,
        subskills: {
          crm_usage: 'CRM system proficiency',
          tools: 'Sales tools and automation',
          digital_marketing: 'Online presence and marketing',
          data_analysis: 'Performance metrics understanding'
        }
      }
    };
    
    this.coachingStrategies = {
      REAL_TIME: 'real_time', // During calls
      POST_CALL: 'post_call', // Immediately after calls
      DAILY: 'daily', // Daily coaching sessions
      WEEKLY: 'weekly', // Weekly development plans
      MONTHLY: 'monthly' // Monthly performance reviews
    };
    
    this.interventionTypes = {
      IMMEDIATE: 'immediate', // Stop and correct now
      GENTLE: 'gentle', // Subtle suggestions
      POST_CALL: 'post_call', // Debrief after call
      SCHEDULED: 'scheduled' // Plan for later training
    };
  }

  // Create or update agent profile
  async createAgentProfile(agentData) {
    const profile = {
      id: agentData.agentId,
      name: agentData.name,
      startDate: agentData.startDate || new Date(),
      experience: agentData.experience || 'beginner',
      goals: agentData.goals || {},
      preferences: {
        learningStyle: agentData.learningStyle || 'visual',
        coachingFrequency: agentData.coachingFrequency || 'moderate',
        feedbackStyle: agentData.feedbackStyle || 'constructive'
      },
      
      // Performance tracking
      currentSkills: this.initializeSkillScores(),
      historicalPerformance: [],
      improvements: [],
      challenges: [],
      
      // Training
      completedTraining: [],
      activeTrainingPlan: null,
      certifications: [],
      
      // Behavioral patterns
      callPatterns: {
        avgDuration: 0,
        preferredTimes: [],
        successfulTechniques: [],
        problematicAreas: []
      },
      
      // Coaching history
      interventions: [],
      feedback: [],
      achievements: [],
      
      // AI insights
      aiInsights: {
        strengths: [],
        weaknesses: [],
        potentialActions: [],
        riskFactors: [],
        growthPrediction: 'stable'
      },
      
      lastUpdated: new Date()
    };
    
    this.agentProfiles.set(agentData.agentId, profile);
    return profile;
  }

  // Initialize skill scores for new agents
  initializeSkillScores() {
    const scores = {};
    
    Object.keys(this.skillFramework).forEach(category => {
      scores[category] = {};
      Object.keys(this.skillFramework[category].subskills).forEach(skill => {
        scores[category][skill] = {
          score: 50, // Start at 50% proficiency
          confidence: 10, // Low confidence initially
          lastAssessed: new Date(),
          trend: 'unknown'
        };
      });
    });
    
    return scores;
  }

  // Analyze call and provide real-time coaching
  async analyzeCallForCoaching(callData) {
    const { transcript, metadata, realTime = false } = callData;
    const agentId = metadata.agentId;
    
    try {
      // Get agent profile
      let profile = this.agentProfiles.get(agentId);
      if (!profile) {
        profile = await this.createAgentProfile({ agentId, name: metadata.agentName });
      }
      
      // Analyze call with coaching focus
      const analysis = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert real estate sales coach analyzing agent performance in real-time.
            
            Agent Profile:
            - Experience: ${profile.experience}
            - Current strengths: ${profile.aiInsights.strengths.join(', ')}
            - Known challenges: ${profile.aiInsights.weaknesses.join(', ')}
            - Learning style: ${profile.preferences.learningStyle}
            
            Focus on:
            1. Immediate coaching opportunities (what to do right now)
            2. Skill gaps evident in this conversation
            3. Behavioral patterns that need addressing
            4. Positive reinforcement opportunities
            5. Risk assessment (call going poorly?)
            
            Provide coaching that is:
            - Specific and actionable
            - Appropriate for their experience level
            - Builds on their strengths
            - Addresses their known challenges
            
            Consider the agent's learning style and coaching preferences.`
          },
          {
            role: 'user',
            content: `Call Analysis:
            Agent: ${metadata.agentName}
            Customer: ${metadata.customerName}
            Duration so far: ${metadata.duration || 0} seconds
            Real-time: ${realTime}
            
            Transcript:
            ${transcript}
            
            Provide real-time coaching analysis.`
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.4
      });

      const coachingAnalysis = JSON.parse(analysis.choices[0].message.content);
      
      // Update agent profile with insights
      await this.updateAgentProfile(agentId, coachingAnalysis);
      
      // Generate coaching interventions
      const interventions = this.generateCoachingInterventions(
        agentId, 
        coachingAnalysis, 
        realTime
      );
      
      // Update skill assessments
      const skillUpdates = this.assessSkillsFromCall(transcript, profile);
      
      // Create coaching response
      const coachingResponse = {
        agentId,
        timestamp: new Date(),
        callId: metadata.callId,
        analysis: coachingAnalysis,
        interventions,
        skillUpdates,
        recommendations: this.generateRecommendations(profile, coachingAnalysis),
        urgency: this.calculateUrgency(coachingAnalysis),
        confidence: this.calculateConfidence(coachingAnalysis),
        followUpRequired: this.determineFollowUp(coachingAnalysis)
      };
      
      return coachingResponse;
      
    } catch (error) {
      console.error('AI Coaching analysis error:', error);
      return this.getFallbackCoaching(agentId, callData);
    }
  }

  // Generate coaching interventions based on analysis
  generateCoachingInterventions(agentId, analysis, realTime) {
    const interventions = [];
    const profile = this.agentProfiles.get(agentId);
    
    // Real-time interventions
    if (realTime && analysis.immediate_opportunities) {
      analysis.immediate_opportunities.forEach(opportunity => {
        interventions.push({
          type: this.interventionTypes.IMMEDIATE,
          priority: 'high',
          title: opportunity.title,
          message: opportunity.suggestion,
          timing: 'now',
          category: opportunity.category,
          expectedOutcome: opportunity.expected_outcome,
          confidenceLevel: opportunity.confidence || 'medium'
        });
      });
    }
    
    // Gentle suggestions during call
    if (analysis.gentle_suggestions) {
      analysis.gentle_suggestions.forEach(suggestion => {
        interventions.push({
          type: this.interventionTypes.GENTLE,
          priority: 'medium',
          title: suggestion.title,
          message: suggestion.message,
          timing: 'next_opportunity',
          category: suggestion.category
        });
      });
    }
    
    // Post-call coaching points
    if (analysis.post_call_coaching) {
      analysis.post_call_coaching.forEach(point => {
        interventions.push({
          type: this.interventionTypes.POST_CALL,
          priority: point.priority || 'medium',
          title: point.title,
          message: point.coaching_point,
          timing: 'after_call',
          category: point.skill_area,
          developmentActivity: point.suggested_activity
        });
      });
    }
    
    // Schedule training if needed
    if (analysis.skill_gaps && analysis.skill_gaps.length > 0) {
      interventions.push({
        type: this.interventionTypes.SCHEDULED,
        priority: 'low',
        title: 'Skill Development Required',
        message: `Schedule training for: ${analysis.skill_gaps.join(', ')}`,
        timing: 'this_week',
        category: 'development',
        trainingRequired: analysis.skill_gaps
      });
    }
    
    return interventions;
  }

  // Assess skills based on call performance
  assessSkillsFromCall(transcript, profile) {
    const updates = {};
    
    // Simple keyword-based skill assessment
    const skillIndicators = {
      communication: {
        clarity: ['understand', 'let me explain', 'to clarify', 'what I mean is'],
        listening: ['I hear you', 'you mentioned', 'what you\'re saying', 'I understand'],
        empathy: ['I can imagine', 'I understand how', 'that must be', 'I appreciate'],
        persuasion: ['because', 'the benefit', 'what this means for you', 'imagine if']
      },
      sales: {
        discovery: ['tell me about', 'what\'s important', 'help me understand', 'what are you looking for'],
        presentation: ['this property offers', 'the benefits are', 'what makes this special'],
        objection_handling: ['I understand your concern', 'let me address that', 'that\'s a good question'],
        closing: ['when would you like', 'shall we', 'are you ready to', 'next step']
      }
    };
    
    // Analyze transcript for skill indicators
    const lowerTranscript = transcript.toLowerCase();
    
    Object.keys(skillIndicators).forEach(category => {
      Object.keys(skillIndicators[category]).forEach(skill => {
        const indicators = skillIndicators[category][skill];
        const count = indicators.reduce((total, indicator) => {
          return total + (lowerTranscript.match(new RegExp(indicator, 'g')) || []).length;
        }, 0);
        
        // Update skill score based on usage
        const currentScore = profile.currentSkills[category][skill].score;
        const adjustment = Math.min(count * 2, 5); // Max 5 point increase per call
        
        updates[`${category}.${skill}`] = {
          previousScore: currentScore,
          newScore: Math.min(100, currentScore + adjustment),
          confidence: Math.min(100, profile.currentSkills[category][skill].confidence + 1),
          evidence: `Used ${count} relevant phrases in call`,
          lastAssessed: new Date()
        };
      });
    });
    
    return updates;
  }

  // Create personalized training plan
  async createTrainingPlan(agentId, duration = 'monthly') {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) throw new Error('Agent profile not found');
    
    // Analyze current skills and identify gaps
    const skillGaps = this.identifySkillGaps(profile);
    const priorityAreas = this.prioritizeTrainingAreas(profile, skillGaps);
    
    // Generate AI-powered training plan
    const planGeneration = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Create a personalized real estate agent training plan.
          
          Agent Profile:
          - Experience: ${profile.experience}
          - Learning Style: ${profile.preferences.learningStyle}
          - Current Challenges: ${profile.aiInsights.weaknesses.join(', ')}
          - Strengths to build on: ${profile.aiInsights.strengths.join(', ')}
          
          Duration: ${duration}
          
          Create a structured plan with:
          1. Weekly objectives
          2. Daily activities (15-30 minutes each)
          3. Practice scenarios
          4. Measurable outcomes
          5. Progress checkpoints
          
          Focus on practical, real-world applications.`
        },
        {
          role: 'user',
          content: `Priority Training Areas: ${priorityAreas.map(a => a.area).join(', ')}
          
          Skill Gaps: ${JSON.stringify(skillGaps)}
          
          Recent Performance Issues: ${profile.challenges.slice(-3).join(', ')}
          
          Generate comprehensive training plan.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.6
    });
    
    const aiPlan = JSON.parse(planGeneration.choices[0].message.content);
    
    // Structure the training plan
    const trainingPlan = {
      id: this.generatePlanId(),
      agentId,
      duration,
      createdAt: new Date(),
      status: 'active',
      
      objectives: aiPlan.objectives || [],
      
      weeks: this.structureWeeklyPlan(aiPlan.weekly_plan || [], priorityAreas),
      
      resources: {
        scripts: this.generatePracticeScripts(priorityAreas),
        scenarios: this.generatePracticeScenarios(priorityAreas),
        readings: this.recommendReadings(priorityAreas),
        videos: this.recommendTrainingVideos(priorityAreas)
      },
      
      assessments: this.createAssessments(priorityAreas),
      
      progress: {
        completedActivities: [],
        currentWeek: 1,
        overallProgress: 0,
        skillImprovements: {},
        checkpoints: []
      },
      
      gamification: {
        points: 0,
        badges: [],
        achievements: [],
        streak: 0,
        level: 1
      }
    };
    
    // Store training plan
    this.trainingPlans.set(trainingPlan.id, trainingPlan);
    profile.activeTrainingPlan = trainingPlan.id;
    
    return trainingPlan;
  }

  // Identify skill gaps for an agent
  identifySkillGaps(profile) {
    const gaps = [];
    const threshold = 60; // Skills below 60% are considered gaps
    
    Object.keys(profile.currentSkills).forEach(category => {
      Object.keys(profile.currentSkills[category]).forEach(skill => {
        const skillData = profile.currentSkills[category][skill];
        if (skillData.score < threshold) {
          gaps.push({
            category,
            skill,
            score: skillData.score,
            gap: threshold - skillData.score,
            confidence: skillData.confidence,
            priority: this.calculateSkillPriority(category, skill, skillData.score)
          });
        }
      });
    });
    
    return gaps.sort((a, b) => b.priority - a.priority);
  }

  // Prioritize training areas based on business impact
  prioritizeTrainingAreas(profile, skillGaps) {
    const businessImpact = {
      closing: 10,
      objection_handling: 9,
      discovery: 8,
      presentation: 7,
      listening: 6,
      persuasion: 6,
      empathy: 5,
      clarity: 5,
      properties: 4,
      processes: 4,
      pricing: 3,
      professionalism: 3
    };
    
    return skillGaps
      .map(gap => ({
        ...gap,
        area: gap.skill,
        businessImpact: businessImpact[gap.skill] || 1,
        totalPriority: gap.priority + (businessImpact[gap.skill] || 1)
      }))
      .sort((a, b) => b.totalPriority - a.totalPriority)
      .slice(0, 5); // Focus on top 5 areas
  }

  // Track daily coaching interactions
  async recordCoachingInteraction(agentId, interaction) {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) return;
    
    const record = {
      id: this.generateInteractionId(),
      timestamp: new Date(),
      type: interaction.type,
      context: interaction.context,
      coaching: interaction.coaching,
      agentResponse: interaction.agentResponse,
      outcome: interaction.outcome,
      followUpRequired: interaction.followUpRequired,
      skillsAddressed: interaction.skillsAddressed || []
    };
    
    profile.interventions.push(record);
    
    // Update skill confidence based on interaction
    if (interaction.skillsAddressed) {
      interaction.skillsAddressed.forEach(skill => {
        const [category, subskill] = skill.split('.');
        if (profile.currentSkills[category] && profile.currentSkills[category][subskill]) {
          profile.currentSkills[category][subskill].confidence = Math.min(100,
            profile.currentSkills[category][subskill].confidence + 2
          );
        }
      });
    }
    
    profile.lastUpdated = new Date();
  }

  // Generate performance insights
  async generatePerformanceInsights(agentId, timeframe = 'week') {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) throw new Error('Agent profile not found');
    
    // Get recent performance data
    const recentData = this.getRecentPerformanceData(agentId, timeframe);
    
    const insights = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `Analyze agent performance and provide actionable insights.
          Focus on trends, patterns, and specific recommendations.
          Be constructive and motivating while being honest about areas for improvement.`
        },
        {
          role: 'user',
          content: `Agent: ${profile.name}
          Timeframe: Last ${timeframe}
          
          Performance Data: ${JSON.stringify(recentData)}
          Current Skill Levels: ${JSON.stringify(profile.currentSkills)}
          Recent Challenges: ${profile.challenges.slice(-5).join(', ')}
          Strengths: ${profile.aiInsights.strengths.join(', ')}
          
          Generate insights and recommendations.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5
    });
    
    return JSON.parse(insights.choices[0].message.content);
  }

  // Predict agent performance and identify risks
  predictAgentPerformance(agentId) {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) return null;
    
    // Simple predictive model based on trends
    const recentPerformance = profile.historicalPerformance.slice(-10);
    const skillTrends = this.analyzeSkillTrends(profile);
    const interventionSuccess = this.analyzeInterventionSuccess(profile);
    
    let prediction = 'stable';
    let confidence = 50;
    let riskFactors = [];
    
    // Analyze trends
    if (recentPerformance.length >= 3) {
      const trend = this.calculateTrend(recentPerformance.map(p => p.overallScore));
      if (trend > 5) {
        prediction = 'improving';
        confidence = 75;
      } else if (trend < -5) {
        prediction = 'declining';
        confidence = 80;
        riskFactors.push('Declining performance trend');
      }
    }
    
    // Check for specific risk factors
    if (profile.challenges.length > 3) {
      riskFactors.push('Multiple ongoing challenges');
    }
    
    const avgSkillScore = this.calculateAverageSkillScore(profile);
    if (avgSkillScore < 40) {
      riskFactors.push('Low overall skill proficiency');
      prediction = 'at_risk';
      confidence = 90;
    }
    
    return {
      prediction,
      confidence,
      riskFactors,
      recommendations: this.generatePredictiveRecommendations(profile, prediction, riskFactors),
      timeframe: '30_days'
    };
  }

  // Update agent profile with new insights
  async updateAgentProfile(agentId, analysis) {
    const profile = this.agentProfiles.get(agentId);
    if (!profile) return;
    
    // Update strengths and weaknesses
    if (analysis.strengths) {
      analysis.strengths.forEach(strength => {
        if (!profile.aiInsights.strengths.includes(strength)) {
          profile.aiInsights.strengths.push(strength);
        }
      });
    }
    
    if (analysis.areas_for_improvement) {
      analysis.areas_for_improvement.forEach(weakness => {
        if (!profile.aiInsights.weaknesses.includes(weakness)) {
          profile.aiInsights.weaknesses.push(weakness);
        }
      });
    }
    
    // Add to challenges if serious issues identified
    if (analysis.serious_concerns) {
      analysis.serious_concerns.forEach(concern => {
        profile.challenges.push({
          concern,
          identified: new Date(),
          severity: 'high'
        });
      });
    }
    
    profile.lastUpdated = new Date();
  }

  // Helper methods
  calculateUrgency(analysis) {
    if (analysis.serious_concerns && analysis.serious_concerns.length > 0) return 'high';
    if (analysis.immediate_opportunities && analysis.immediate_opportunities.length > 2) return 'medium';
    return 'low';
  }

  calculateConfidence(analysis) {
    return analysis.confidence_level || 'medium';
  }

  determineFollowUp(analysis) {
    return analysis.follow_up_required || false;
  }

  generateRecommendations(profile, analysis) {
    const recommendations = [];
    
    // Immediate actions
    if (analysis.immediate_actions) {
      recommendations.push(...analysis.immediate_actions.map(action => ({
        type: 'immediate',
        action,
        priority: 'high'
      })));
    }
    
    // Development suggestions
    if (analysis.development_suggestions) {
      recommendations.push(...analysis.development_suggestions.map(suggestion => ({
        type: 'development',
        action: suggestion,
        priority: 'medium'
      })));
    }
    
    return recommendations;
  }

  getFallbackCoaching(agentId, callData) {
    return {
      agentId,
      timestamp: new Date(),
      analysis: { status: 'system_error' },
      interventions: [{
        type: this.interventionTypes.POST_CALL,
        priority: 'low',
        title: 'General Coaching',
        message: 'Review call performance and identify areas for improvement',
        timing: 'after_call'
      }],
      recommendations: [{
        type: 'system',
        action: 'Continue with standard coaching protocols',
        priority: 'low'
      }]
    };
  }

  // Generate practice scripts for training
  generatePracticeScripts(priorityAreas) {
    const scripts = {};
    
    priorityAreas.forEach(area => {
      scripts[area.area] = {
        scenario: `Practice scenario for ${area.area}`,
        customerLines: [`Customer objection or situation for ${area.area}`],
        coachingPoints: [`Key coaching point for ${area.area}`],
        successCriteria: [`How to measure success in ${area.area}`]
      };
    });
    
    return scripts;
  }

  generatePracticeScenarios(priorityAreas) {
    return priorityAreas.map(area => ({
      title: `${area.area} Practice`,
      description: `Scenario to practice ${area.area}`,
      difficulty: area.gap > 30 ? 'beginner' : area.gap > 15 ? 'intermediate' : 'advanced',
      duration: '15-20 minutes',
      objectives: [`Improve ${area.area} skills`]
    }));
  }

  calculateSkillPriority(category, skill, score) {
    const categoryWeight = this.skillFramework[category]?.weight || 10;
    const skillImportance = 10 - (score / 10); // Lower scores = higher priority
    return categoryWeight * skillImportance;
  }

  calculateTrend(values) {
    if (values.length < 2) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const recent = values.slice(-3).reduce((a, b) => a + b, 0) / Math.min(3, values.length);
    return recent - avg;
  }

  calculateAverageSkillScore(profile) {
    let totalScore = 0;
    let skillCount = 0;
    
    Object.values(profile.currentSkills).forEach(category => {
      Object.values(category).forEach(skill => {
        totalScore += skill.score;
        skillCount++;
      });
    });
    
    return skillCount > 0 ? totalScore / skillCount : 0;
  }

  // ID generators
  generatePlanId() {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateInteractionId() {
    return `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Placeholder methods
  structureWeeklyPlan(weeklyPlan, priorityAreas) {
    return weeklyPlan.map((week, index) => ({
      week: index + 1,
      focus: priorityAreas[index % priorityAreas.length]?.area || 'general',
      activities: week.activities || [],
      goals: week.goals || []
    }));
  }

  recommendReadings(priorityAreas) {
    return priorityAreas.map(area => ({
      title: `${area.area} Best Practices`,
      type: 'article',
      duration: '10 minutes',
      priority: area.priority
    }));
  }

  recommendTrainingVideos(priorityAreas) {
    return priorityAreas.map(area => ({
      title: `Mastering ${area.area}`,
      type: 'video',
      duration: '15 minutes',
      priority: area.priority
    }));
  }

  createAssessments(priorityAreas) {
    return priorityAreas.map(area => ({
      skill: area.area,
      type: 'role_play',
      frequency: 'weekly',
      criteria: [`Demonstration of ${area.area} improvement`]
    }));
  }

  getRecentPerformanceData(agentId, timeframe) {
    const profile = this.agentProfiles.get(agentId);
    return {
      callsCompleted: profile?.historicalPerformance.length || 0,
      avgScore: this.calculateAverageSkillScore(profile) || 0,
      improvements: profile?.improvements.length || 0,
      challenges: profile?.challenges.length || 0
    };
  }

  analyzeSkillTrends(profile) {
    // Simplified trend analysis
    return Object.keys(profile.currentSkills).map(category => ({
      category,
      trend: 'stable', // Would calculate actual trends
      confidence: 'medium'
    }));
  }

  analyzeInterventionSuccess(profile) {
    const totalInterventions = profile.interventions.length;
    const successfulInterventions = profile.interventions.filter(i => 
      i.outcome === 'positive' || i.outcome === 'improved'
    ).length;
    
    return totalInterventions > 0 ? (successfulInterventions / totalInterventions) * 100 : 0;
  }

  generatePredictiveRecommendations(profile, prediction, riskFactors) {
    const recommendations = [];
    
    if (prediction === 'at_risk') {
      recommendations.push('Schedule immediate one-on-one coaching session');
      recommendations.push('Implement daily check-ins and support');
    }
    
    if (prediction === 'declining') {
      recommendations.push('Review recent challenges and adjust training plan');
      recommendations.push('Increase coaching frequency');
    }
    
    return recommendations;
  }
}

// Singleton instance
let coachingBrainInstance = null;

export const getAICoachingBrain = () => {
  if (!coachingBrainInstance) {
    coachingBrainInstance = new AICoachingBrain();
  }
  return coachingBrainInstance;
};

export default AICoachingBrain;