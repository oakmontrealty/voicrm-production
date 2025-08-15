// Call Recording and Transcription System for VoiCRM
// Implements recording, transcription, and AI-powered next steps

class CallRecorder {
  constructor() {
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.stream = null;
    this.transcriptionService = new TranscriptionService();
    this.nextStepsAI = new NextStepsAI();
  }

  async startRecording(stream) {
    try {
      this.stream = stream;
      this.audioChunks = [];
      
      // Create MediaRecorder with optimal settings
      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      // Fallback for browsers that don't support webm
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/mp4';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'audio/ogg';
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, options);
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: options.mimeType });
        await this.processRecording(audioBlob);
      };

      this.mediaRecorder.onerror = (error) => {
        console.error('Recording error:', error);
        this.stopRecording();
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      this.isRecording = true;
      this.recordingStartTime = new Date();
      
      console.log('Call recording started');
      return true;
    } catch (error) {
      console.error('Failed to start recording:', error);
      return false;
    }
  }

  async stopRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.isRecording = false;
      
      const duration = new Date() - this.recordingStartTime;
      console.log(`Recording stopped. Duration: ${Math.round(duration / 1000)}s`);
      
      return true;
    }
    return false;
  }

  async pauseRecording() {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.pause();
      console.log('Recording paused');
      return true;
    }
    return false;
  }

  async resumeRecording() {
    if (this.mediaRecorder && this.isRecording && this.mediaRecorder.state === 'paused') {
      this.mediaRecorder.resume();
      console.log('Recording resumed');
      return true;
    }
    return false;
  }

  async processRecording(audioBlob) {
    try {
      // Save recording
      const recordingUrl = await this.saveRecording(audioBlob);
      
      // Start transcription
      const transcription = await this.transcriptionService.transcribe(audioBlob);
      
      // Generate next steps using AI
      const nextSteps = await this.nextStepsAI.generateNextSteps(transcription);
      
      return {
        url: recordingUrl,
        transcription: transcription,
        nextSteps: nextSteps,
        duration: Math.round((new Date() - this.recordingStartTime) / 1000),
        timestamp: this.recordingStartTime
      };
    } catch (error) {
      console.error('Failed to process recording:', error);
      throw error;
    }
  }

  async saveRecording(audioBlob) {
    // In production, this would upload to cloud storage
    const url = URL.createObjectURL(audioBlob);
    return url;
  }

  getRecordingStatus() {
    if (!this.mediaRecorder) return 'idle';
    return this.mediaRecorder.state;
  }

  getRecordingDuration() {
    if (!this.recordingStartTime) return 0;
    return Math.round((new Date() - this.recordingStartTime) / 1000);
  }
}

// Transcription Service
class TranscriptionService {
  constructor() {
    this.apiEndpoint = '/api/transcribe';
    this.useWebSpeechAPI = true; // Fallback to Web Speech API if available
  }

  async transcribe(audioBlob) {
    try {
      // Try cloud transcription first (more accurate)
      const transcription = await this.cloudTranscribe(audioBlob);
      if (transcription) return transcription;

      // Fallback to Web Speech API
      if (this.useWebSpeechAPI && 'webkitSpeechRecognition' in window) {
        return await this.webSpeechTranscribe(audioBlob);
      }

      return 'Transcription not available';
    } catch (error) {
      console.error('Transcription failed:', error);
      return 'Transcription failed';
    }
  }

  async cloudTranscribe(audioBlob) {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('language', 'en-US');

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        return data.transcription;
      }
    } catch (error) {
      console.error('Cloud transcription failed:', error);
    }
    return null;
  }

  async webSpeechTranscribe(audioBlob) {
    return new Promise((resolve) => {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
          }
        }
      };

      recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
        resolve(finalTranscript || 'Transcription failed');
      };

      recognition.onend = () => {
        resolve(finalTranscript || 'No speech detected');
      };

      // Convert blob to audio and start recognition
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
      recognition.start();

      // Stop after audio ends
      audio.onended = () => {
        setTimeout(() => recognition.stop(), 1000);
      };
    });
  }

  formatTranscription(text, speakers = ['Agent', 'Customer']) {
    // Simple speaker diarization (in production, use ML model)
    const lines = text.split('. ').filter(line => line.trim());
    const formatted = [];
    
    lines.forEach((line, index) => {
      const speaker = speakers[index % speakers.length];
      formatted.push({
        speaker: speaker,
        text: line.trim() + '.',
        timestamp: index * 5 // Approximate timestamp
      });
    });

    return formatted;
  }
}

// AI-Powered Next Steps Generator
class NextStepsAI {
  constructor() {
    this.apiEndpoint = '/api/ai/next-steps';
    this.templates = {
      followUp: [
        'Schedule a follow-up call',
        'Send property information',
        'Arrange property viewing',
        'Provide market analysis',
        'Send contract documents'
      ],
      tasks: [
        'Update CRM with call notes',
        'Add to email campaign',
        'Create task reminder',
        'Update lead status',
        'Assign to team member'
      ]
    };
  }

  async generateNextSteps(transcription) {
    try {
      // Try AI-powered analysis first
      const aiSteps = await this.getAINextSteps(transcription);
      if (aiSteps && aiSteps.length > 0) {
        return aiSteps;
      }

      // Fallback to rule-based analysis
      return this.getRuleBasedNextSteps(transcription);
    } catch (error) {
      console.error('Failed to generate next steps:', error);
      return this.getDefaultNextSteps();
    }
  }

  async getAINextSteps(transcription) {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transcription: transcription,
          context: 'real_estate_call'
        })
      });

      if (response.ok) {
        const data = await response.json();
        return this.formatNextSteps(data.nextSteps);
      }
    } catch (error) {
      console.error('AI next steps generation failed:', error);
    }
    return null;
  }

  getRuleBasedNextSteps(transcription) {
    const text = typeof transcription === 'string' 
      ? transcription.toLowerCase() 
      : transcription.map(t => t.text).join(' ').toLowerCase();

    const nextSteps = [];
    const insights = this.analyzeConversation(text);

    // Generate steps based on conversation analysis
    if (insights.interestedInViewing) {
      nextSteps.push({
        type: 'task',
        priority: 'high',
        title: 'Schedule Property Viewing',
        description: 'Customer expressed interest in viewing the property',
        dueDate: this.getNextBusinessDay(),
        automate: true
      });
    }

    if (insights.requestedInfo) {
      nextSteps.push({
        type: 'task',
        priority: 'medium',
        title: 'Send Property Information',
        description: 'Email detailed property information and photos',
        dueDate: this.getToday(),
        automate: true
      });
    }

    if (insights.priceDiscussion) {
      nextSteps.push({
        type: 'task',
        priority: 'medium',
        title: 'Prepare Market Analysis',
        description: 'Create CMA report for price justification',
        dueDate: this.getNextBusinessDay(),
        automate: false
      });
    }

    if (insights.followUpRequested) {
      nextSteps.push({
        type: 'reminder',
        priority: 'high',
        title: 'Follow-up Call',
        description: 'Customer requested a follow-up',
        dueDate: insights.followUpDate || this.getNextWeek(),
        automate: true
      });
    }

    // Always add CRM update
    nextSteps.push({
      type: 'task',
      priority: 'low',
      title: 'Update CRM',
      description: 'Log call notes and update lead status',
      dueDate: this.getToday(),
      automate: true
    });

    return nextSteps;
  }

  analyzeConversation(text) {
    return {
      interestedInViewing: /view|visit|see|inspect|look at/.test(text),
      requestedInfo: /send|email|information|details|brochure/.test(text),
      priceDiscussion: /price|cost|afford|budget|finance|loan/.test(text),
      followUpRequested: /call back|follow up|contact|reach out/.test(text),
      appointment: /appointment|meeting|schedule|book/.test(text),
      objections: /expensive|not sure|think about|consider/.test(text),
      urgent: /asap|urgent|immediately|today|now/.test(text)
    };
  }

  formatNextSteps(steps) {
    return steps.map(step => ({
      ...step,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      status: 'pending'
    }));
  }

  getDefaultNextSteps() {
    return [
      {
        type: 'task',
        priority: 'medium',
        title: 'Review Call Recording',
        description: 'Listen to the recording and add notes',
        dueDate: this.getToday(),
        automate: false
      },
      {
        type: 'task',
        priority: 'low',
        title: 'Update Contact Record',
        description: 'Update CRM with latest interaction',
        dueDate: this.getToday(),
        automate: true
      }
    ];
  }

  // Utility functions
  generateId() {
    return 'step_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getToday() {
    return new Date().toISOString().split('T')[0];
  }

  getNextBusinessDay() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    if (date.getDay() === 0) date.setDate(date.getDate() + 1); // Skip Sunday
    if (date.getDay() === 6) date.setDate(date.getDate() + 2); // Skip Saturday
    return date.toISOString().split('T')[0];
  }

  getNextWeek() {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  }
}

// Call Summary Generator
class CallSummaryGenerator {
  generateSummary(transcription, nextSteps, metadata) {
    const duration = this.formatDuration(metadata.duration);
    const keyPoints = this.extractKeyPoints(transcription);
    
    return {
      title: `Call with ${metadata.contactName || 'Unknown'}`,
      date: metadata.timestamp,
      duration: duration,
      outcome: this.determineOutcome(transcription, nextSteps),
      keyPoints: keyPoints,
      nextSteps: nextSteps,
      sentiment: this.analyzeSentiment(transcription),
      tags: this.generateTags(transcription, keyPoints)
    };
  }

  formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  extractKeyPoints(transcription) {
    // Extract important points from conversation
    const points = [];
    const text = typeof transcription === 'string' 
      ? transcription 
      : transcription.map(t => t.text).join(' ');

    // Property mentions
    const propertyMatch = text.match(/\d+\s+\w+\s+(street|st|road|rd|avenue|ave)/gi);
    if (propertyMatch) {
      points.push(`Discussed property: ${propertyMatch[0]}`);
    }

    // Price mentions
    const priceMatch = text.match(/\$[\d,]+/g);
    if (priceMatch) {
      points.push(`Price point: ${priceMatch[0]}`);
    }

    // Timeline mentions
    const timelineMatch = text.match(/(next week|this week|tomorrow|today|asap)/gi);
    if (timelineMatch) {
      points.push(`Timeline: ${timelineMatch[0]}`);
    }

    return points;
  }

  determineOutcome(transcription, nextSteps) {
    const hasViewing = nextSteps.some(s => s.title.includes('Viewing'));
    const hasFollowUp = nextSteps.some(s => s.title.includes('Follow-up'));
    
    if (hasViewing) return 'Positive - Viewing Scheduled';
    if (hasFollowUp) return 'Interested - Follow-up Required';
    return 'Information Gathering';
  }

  analyzeSentiment(transcription) {
    const text = typeof transcription === 'string' 
      ? transcription.toLowerCase() 
      : transcription.map(t => t.text).join(' ').toLowerCase();

    const positiveWords = ['great', 'excellent', 'perfect', 'love', 'interested', 'excited'];
    const negativeWords = ['not', 'expensive', 'problem', 'issue', 'concern', 'worried'];

    const positiveCount = positiveWords.filter(word => text.includes(word)).length;
    const negativeCount = negativeWords.filter(word => text.includes(word)).length;

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  generateTags(transcription, keyPoints) {
    const tags = [];
    const text = (typeof transcription === 'string' 
      ? transcription 
      : transcription.map(t => t.text).join(' ')).toLowerCase();

    if (text.includes('buy')) tags.push('buyer');
    if (text.includes('sell')) tags.push('seller');
    if (text.includes('rent')) tags.push('rental');
    if (text.includes('invest')) tags.push('investor');
    if (text.includes('first home')) tags.push('first-home-buyer');
    
    return tags;
  }
}

// Export for use in calling system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CallRecorder,
    TranscriptionService,
    NextStepsAI,
    CallSummaryGenerator
  };
}

// Make available globally
window.CallRecorder = CallRecorder;
window.TranscriptionService = TranscriptionService;
window.NextStepsAI = NextStepsAI;
window.CallSummaryGenerator = CallSummaryGenerator;