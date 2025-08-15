// AI Next Steps Generator using Ollama (FREE)
// Automatically generates follow-up tasks and actions after each call

class AINextSteps {
  constructor() {
    // Using Ollama - no API key needed, runs locally for FREE
    this.ollamaEndpoint = 'http://localhost:11434/api/generate';
    this.model = 'llama3.2';
    
    this.taskTypes = {
      FOLLOW_UP: 'follow_up',
      APPOINTMENT: 'appointment',
      DOCUMENT: 'document',
      RESEARCH: 'research',
      CALLBACK: 'callback',
      EMAIL: 'email',
      TEXT: 'text',
      PROPERTY_VIEWING: 'property_viewing',
      CONTRACT: 'contract',
      REFERRAL: 'referral'
    };
    
    this.priorityLevels = {
      URGENT: { level: 1, color: '#dc2626', label: 'Urgent' },
      HIGH: { level: 2, color: '#ea580c', label: 'High' },
      MEDIUM: { level: 3, color: '#ca8a04', label: 'Medium' },
      LOW: { level: 4, color: '#16a34a', label: 'Low' }
    };
  }

  // Generate next steps from call transcript using FREE Ollama
  async generateNextSteps(callData) {
    try {
      const { transcript, metadata, callScore, duration } = callData;
      
      const prompt = `You are an expert real estate sales assistant. Analyze this call and generate specific next steps.

Call Information:
- Duration: ${duration} seconds
- Call Score: ${callScore || 'N/A'}
- Agent: ${metadata?.agentName || 'Agent'}
- Customer: ${metadata?.customerName || 'Customer'}
- Property: ${metadata?.propertyAddress || 'General inquiry'}

Transcript:
${transcript || 'No transcript available'}

Generate 3-5 actionable next steps in this EXACT JSON format:
{
  "nextSteps": [
    {
      "type": "follow_up/appointment/document/email/text/property_viewing",
      "priority": "urgent/high/medium/low",
      "action": "Specific action to take",
      "deadline": "Within 24 hours/48 hours/1 week",
      "details": "Additional context or requirements",
      "successCriteria": "What success looks like"
    }
  ],
  "reminders": ["Reminder 1", "Reminder 2"],
  "suggestedTemplates": {
    "email": "Follow-up email template if needed",
    "text": "SMS template if needed"
  }
}

Focus on concrete, actionable steps that move the sale forward.
IMPORTANT: Respond with ONLY valid JSON.`;

      console.log('Generating next steps with FREE Ollama AI...');
      
      // Call Ollama (running locally, no API costs)
      const response = await fetch(this.ollamaEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 1000,
            top_p: 0.9
          }
        })
      });

      if (!response.ok) {
        throw new Error('Ollama request failed');
      }

      const data = await response.json();
      
      // Parse Ollama response
      let result;
      try {
        let cleanedResponse = data.response.trim();
        // Remove markdown if present
        if (cleanedResponse.includes('```')) {
          cleanedResponse = cleanedResponse.replace(/```json?\s*/g, '').replace(/```\s*$/g, '');
        }
        result = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse Ollama response:', parseError);
        // Fallback to intelligent defaults
        result = this.getDefaultNextSteps(transcript, metadata);
      }
      
      // Process and enhance the next steps
      const nextSteps = this.processNextSteps(result, metadata);
      
      // Generate smart reminders
      const reminders = this.generateReminders(nextSteps, metadata);
      
      // Check for conflicts
      const conflicts = await this.checkConflicts(nextSteps, metadata?.agentId);
      
      console.log('✓ Next steps generated with FREE Ollama AI');
      
      return {
        nextSteps,
        reminders,
        conflicts,
        templates: result.suggestedTemplates || {},
        generatedAt: new Date().toISOString(),
        aiProvider: 'Ollama (Local, Free)'
      };
      
    } catch (error) {
      console.error('Error generating next steps:', error);
      // Return intelligent fallback
      return this.getFallbackNextSteps(callData);
    }
  }

  // Process and enhance next steps
  processNextSteps(result, metadata) {
    const nextSteps = result.nextSteps || [];
    
    return nextSteps.map((step, index) => ({
      id: `step_${Date.now()}_${index}`,
      type: step.type || this.taskTypes.FOLLOW_UP,
      priority: this.priorityLevels[step.priority?.toUpperCase()] || this.priorityLevels.MEDIUM,
      action: step.action || 'Follow up with client',
      deadline: this.calculateDeadline(step.deadline),
      details: step.details || '',
      successCriteria: step.successCriteria || 'Task completed successfully',
      status: 'pending',
      createdAt: new Date().toISOString(),
      assignedTo: metadata?.agentId || null,
      relatedCall: metadata?.callId || null,
      automatable: this.isAutomatable(step.type)
    }));
  }

  // Calculate actual deadline from description
  calculateDeadline(deadlineDesc) {
    const now = new Date();
    
    if (!deadlineDesc) return new Date(now.getTime() + 48 * 60 * 60 * 1000); // Default 48 hours
    
    const desc = deadlineDesc.toLowerCase();
    if (desc.includes('24 hour') || desc.includes('tomorrow')) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    } else if (desc.includes('48 hour') || desc.includes('2 day')) {
      return new Date(now.getTime() + 48 * 60 * 60 * 1000);
    } else if (desc.includes('week') || desc.includes('7 day')) {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (desc.includes('urgent') || desc.includes('asap')) {
      return new Date(now.getTime() + 4 * 60 * 60 * 1000); // 4 hours
    }
    
    return new Date(now.getTime() + 48 * 60 * 60 * 1000); // Default 48 hours
  }

  // Check if task can be automated
  isAutomatable(type) {
    return [
      this.taskTypes.EMAIL,
      this.taskTypes.TEXT,
      this.taskTypes.DOCUMENT,
      this.taskTypes.APPOINTMENT
    ].includes(type);
  }

  // Generate smart reminders
  generateReminders(nextSteps, metadata) {
    const reminders = [];
    
    nextSteps.forEach(step => {
      if (step.priority.level <= 2) { // Urgent or High priority
        reminders.push({
          time: new Date(step.deadline.getTime() - 60 * 60 * 1000), // 1 hour before
          message: `Reminder: ${step.action}`,
          type: 'notification'
        });
      }
    });
    
    return reminders;
  }

  // Check for scheduling conflicts
  async checkConflicts(nextSteps, agentId) {
    // In production, this would check against calendar/CRM
    const conflicts = [];
    
    nextSteps.forEach(step => {
      if (step.type === this.taskTypes.APPOINTMENT || step.type === this.taskTypes.PROPERTY_VIEWING) {
        // Check for time conflicts
        // This is a placeholder for actual conflict checking
      }
    });
    
    return conflicts;
  }

  // Update a specific step
  async updateStep(stepId, updates) {
    // Update logic here
    return {
      success: true,
      stepId,
      updates,
      updatedAt: new Date().toISOString()
    };
  }

  // Mark step as complete
  async completeStep(stepId, completionNotes) {
    return {
      success: true,
      stepId,
      status: 'completed',
      completionNotes,
      completedAt: new Date().toISOString()
    };
  }

  // Execute automated actions
  async executeAutomatedActions(steps) {
    const results = [];
    
    for (const step of steps) {
      if (step.automatable) {
        // Execute automated action based on type
        results.push({
          stepId: step.id,
          executed: true,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    return results;
  }

  // Generate templates for communication
  async generateTemplates(nextSteps, transcript, metadata) {
    const templates = {};
    
    const hasEmail = nextSteps.some(s => s.type === this.taskTypes.EMAIL);
    const hasText = nextSteps.some(s => s.type === this.taskTypes.TEXT);
    
    if (hasEmail) {
      templates.email = this.generateEmailTemplate(transcript, metadata);
    }
    
    if (hasText) {
      templates.text = this.generateTextTemplate(transcript, metadata);
    }
    
    return templates;
  }

  // Generate email template
  generateEmailTemplate(transcript, metadata) {
    return `Dear ${metadata?.customerName || 'Valued Client'},

Thank you for our conversation today about your real estate needs.

As discussed, I'll be following up with:
- Property listings matching your criteria
- Market analysis for your area of interest
- Financing options available

Please don't hesitate to reach out if you have any questions.

Best regards,
${metadata?.agentName || 'Your Real Estate Agent'}`;
  }

  // Generate SMS template
  generateTextTemplate(transcript, metadata) {
    return `Hi ${metadata?.customerName || 'there'}! Following up on our call. I'll send you the property details we discussed shortly. Let me know if you need anything else!`;
  }

  // Get default next steps if AI fails
  getDefaultNextSteps(transcript, metadata) {
    return {
      nextSteps: [
        {
          type: 'follow_up',
          priority: 'high',
          action: 'Send follow-up email with discussed property listings',
          deadline: 'Within 24 hours',
          details: 'Include properties matching client criteria',
          successCriteria: 'Client receives and reviews listings'
        },
        {
          type: 'callback',
          priority: 'medium',
          action: 'Schedule follow-up call',
          deadline: 'Within 48 hours',
          details: 'Check if client reviewed materials and answer questions',
          successCriteria: 'Follow-up call completed'
        },
        {
          type: 'document',
          priority: 'medium',
          action: 'Prepare comparative market analysis',
          deadline: 'Within 1 week',
          details: 'Based on properties discussed',
          successCriteria: 'CMA delivered to client'
        }
      ],
      reminders: ['Follow up within 24 hours', 'Check CRM notes before next contact'],
      suggestedTemplates: {}
    };
  }

  // Fallback next steps when everything fails
  getFallbackNextSteps(callData) {
    return {
      nextSteps: [
        {
          id: `step_${Date.now()}_0`,
          type: this.taskTypes.FOLLOW_UP,
          priority: this.priorityLevels.HIGH,
          action: 'Review call and send follow-up communication',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          details: 'Review call notes and send appropriate follow-up',
          successCriteria: 'Client engaged with follow-up',
          status: 'pending',
          createdAt: new Date().toISOString(),
          automatable: false
        }
      ],
      reminders: [],
      conflicts: [],
      templates: {},
      generatedAt: new Date().toISOString(),
      aiProvider: 'Ollama (Fallback Mode)'
    };
  }
}

// Export singleton instance
let instance = null;

export function getAINextSteps() {
  if (!instance) {
    instance = new AINextSteps();
  }
  return instance;
}

export default AINextSteps;