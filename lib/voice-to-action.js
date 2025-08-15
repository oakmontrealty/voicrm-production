// Voice-to-Action for Property Inspections with GPS
import { Configuration, OpenAIApi } from 'openai';

class VoiceToAction {
  constructor() {
    this.openai = null;
    this.isRecording = false;
    this.currentInspection = null;
    this.inspections = new Map();
    this.actionQueue = [];
    this.mediaRecorder = null;
    this.audioChunks = [];
  }

  initialize() {
    if (process.env.OPENAI_API_KEY) {
      const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.openai = new OpenAIApi(configuration);
    }
  }

  // Start new property inspection
  async startInspection(propertyData) {
    const inspectionId = `inspect_${Date.now()}`;
    
    // Get current GPS location
    const location = await this.getCurrentLocation();
    
    this.currentInspection = {
      id: inspectionId,
      property: propertyData,
      startTime: new Date(),
      location: location,
      notes: [],
      photos: [],
      measurements: [],
      issues: [],
      features: [],
      tasks: [],
      voiceNotes: [],
      status: 'active'
    };
    
    this.inspections.set(inspectionId, this.currentInspection);
    
    // Start voice recording if available
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      await this.startVoiceRecording();
    }
    
    return this.currentInspection;
  }

  // Get current GPS location
  async getCurrentLocation() {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return { lat: null, lng: null, accuracy: null };
    }
    
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date()
          });
        },
        (error) => {
          console.error('GPS error:', error);
          resolve({ lat: null, lng: null, accuracy: null, error: error.message });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  }

  // Start voice recording
  async startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.processVoiceNote(audioBlob);
      };
      
      // Start recording in 30-second chunks for continuous processing
      this.mediaRecorder.start(30000);
      this.isRecording = true;
      
      console.log('Voice recording started');
    } catch (error) {
      console.error('Error starting voice recording:', error);
    }
  }

  // Stop voice recording
  stopVoiceRecording() {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
      this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
      this.isRecording = false;
      console.log('Voice recording stopped');
    }
  }

  // Process voice note and extract actions
  async processVoiceNote(audioBlob) {
    if (!this.currentInspection) return;
    
    const voiceNoteId = `voice_${Date.now()}`;
    const location = await this.getCurrentLocation();
    
    // Convert audio to base64 for processing
    const base64Audio = await this.blobToBase64(audioBlob);
    
    // Transcribe audio (in production, would use Whisper API)
    const transcription = await this.transcribeAudio(base64Audio);
    
    // Extract actions and information from transcription
    const extractedData = await this.extractActionsFromText(transcription);
    
    const voiceNote = {
      id: voiceNoteId,
      timestamp: new Date(),
      location,
      transcription,
      audioBlob: base64Audio,
      extractedData,
      processed: true
    };
    
    this.currentInspection.voiceNotes.push(voiceNote);
    
    // Process extracted actions
    await this.processExtractedActions(extractedData);
    
    return voiceNote;
  }

  // Convert blob to base64
  blobToBase64(blob) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  // Transcribe audio using Whisper
  async transcribeAudio(base64Audio) {
    // In production, this would call OpenAI Whisper API
    // For now, return mock transcription
    return "The main bedroom is spacious, approximately 4 by 5 meters. There's a crack in the ceiling that needs repair. The ensuite bathroom has modern fixtures but the tap is leaking. Add task to fix the tap and patch the ceiling crack. The view from this room is excellent, facing north with good natural light.";
  }

  // Extract actions and information from text
  async extractActionsFromText(text) {
    if (!this.openai) {
      return this.basicActionExtraction(text);
    }
    
    try {
      const prompt = `Analyze this property inspection voice note and extract:
1. Room/Area being described
2. Measurements mentioned
3. Issues or repairs needed
4. Positive features
5. Tasks to create
6. Any specific instructions

Voice note: "${text}"

Return as JSON with these categories.`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a real estate inspection assistant extracting actionable information from voice notes." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      });
      
      return JSON.parse(completion.data.choices[0].message.content);
    } catch (error) {
      console.error('Error extracting actions:', error);
      return this.basicActionExtraction(text);
    }
  }

  // Basic action extraction without AI
  basicActionExtraction(text) {
    const lower = text.toLowerCase();
    const extracted = {
      room: null,
      measurements: [],
      issues: [],
      features: [],
      tasks: [],
      instructions: []
    };
    
    // Extract room mentions
    const rooms = ['bedroom', 'bathroom', 'kitchen', 'living', 'dining', 'garage', 'garden', 'ensuite'];
    rooms.forEach(room => {
      if (lower.includes(room)) {
        extracted.room = room;
      }
    });
    
    // Extract measurements (basic pattern matching)
    const measurementPattern = /(\d+)\s*(by|x)\s*(\d+)\s*(meters?|m|feet|ft)?/gi;
    const measurements = text.match(measurementPattern);
    if (measurements) {
      extracted.measurements = measurements;
    }
    
    // Extract issues
    const issueKeywords = ['crack', 'broken', 'damage', 'repair', 'fix', 'leak', 'issue', 'problem'];
    issueKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(keyword)) {
            extracted.issues.push(sentence.trim());
          }
        });
      }
    });
    
    // Extract tasks
    const taskKeywords = ['add task', 'remind', 'schedule', 'need to', 'must', 'should'];
    taskKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(keyword)) {
            extracted.tasks.push({
              description: sentence.trim(),
              priority: lower.includes('urgent') ? 'high' : 'normal'
            });
          }
        });
      }
    });
    
    // Extract positive features
    const featureKeywords = ['excellent', 'good', 'modern', 'spacious', 'beautiful', 'great', 'nice'];
    featureKeywords.forEach(keyword => {
      if (lower.includes(keyword)) {
        const sentences = text.split(/[.!?]/);
        sentences.forEach(sentence => {
          if (sentence.toLowerCase().includes(keyword)) {
            extracted.features.push(sentence.trim());
          }
        });
      }
    });
    
    return extracted;
  }

  // Process extracted actions
  async processExtractedActions(extractedData) {
    if (!this.currentInspection) return;
    
    // Add measurements
    if (extractedData.measurements && extractedData.measurements.length > 0) {
      this.currentInspection.measurements.push({
        room: extractedData.room,
        measurements: extractedData.measurements,
        timestamp: new Date()
      });
    }
    
    // Add issues
    if (extractedData.issues && extractedData.issues.length > 0) {
      extractedData.issues.forEach(issue => {
        this.currentInspection.issues.push({
          description: issue,
          room: extractedData.room,
          priority: this.determinePriority(issue),
          timestamp: new Date(),
          location: this.currentInspection.location
        });
      });
    }
    
    // Add features
    if (extractedData.features && extractedData.features.length > 0) {
      extractedData.features.forEach(feature => {
        this.currentInspection.features.push({
          description: feature,
          room: extractedData.room,
          timestamp: new Date()
        });
      });
    }
    
    // Create tasks
    if (extractedData.tasks && extractedData.tasks.length > 0) {
      extractedData.tasks.forEach(task => {
        const newTask = {
          id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          description: task.description || task,
          priority: task.priority || 'normal',
          status: 'pending',
          createdAt: new Date(),
          room: extractedData.room,
          inspectionId: this.currentInspection.id
        };
        
        this.currentInspection.tasks.push(newTask);
        this.actionQueue.push(newTask);
      });
    }
  }

  // Determine priority based on keywords
  determinePriority(text) {
    const urgentKeywords = ['urgent', 'critical', 'immediate', 'asap', 'emergency'];
    const highKeywords = ['important', 'major', 'significant', 'serious'];
    
    const lower = text.toLowerCase();
    
    if (urgentKeywords.some(keyword => lower.includes(keyword))) {
      return 'urgent';
    }
    if (highKeywords.some(keyword => lower.includes(keyword))) {
      return 'high';
    }
    return 'normal';
  }

  // Add photo to inspection
  async addPhoto(photoData, caption = '') {
    if (!this.currentInspection) return;
    
    const location = await this.getCurrentLocation();
    
    const photo = {
      id: `photo_${Date.now()}`,
      data: photoData,
      caption,
      location,
      timestamp: new Date(),
      room: this.currentInspection.voiceNotes.length > 0 
        ? this.currentInspection.voiceNotes[this.currentInspection.voiceNotes.length - 1].extractedData.room
        : null
    };
    
    this.currentInspection.photos.push(photo);
    return photo;
  }

  // Complete inspection and generate report
  async completeInspection() {
    if (!this.currentInspection) return null;
    
    this.stopVoiceRecording();
    
    this.currentInspection.endTime = new Date();
    this.currentInspection.status = 'completed';
    this.currentInspection.duration = 
      (this.currentInspection.endTime - this.currentInspection.startTime) / 1000 / 60; // minutes
    
    // Generate inspection report
    const report = await this.generateInspectionReport();
    
    this.currentInspection.report = report;
    
    const completedInspection = this.currentInspection;
    this.currentInspection = null;
    
    return completedInspection;
  }

  // Generate inspection report
  async generateInspectionReport() {
    const inspection = this.currentInspection;
    
    const report = {
      summary: {
        propertyAddress: inspection.property.address,
        inspectionDate: inspection.startTime,
        duration: `${Math.round(inspection.duration)} minutes`,
        inspector: inspection.property.agentName || 'Agent',
        gpsVerified: inspection.location.lat !== null
      },
      findings: {
        totalIssues: inspection.issues.length,
        urgentIssues: inspection.issues.filter(i => i.priority === 'urgent').length,
        features: inspection.features.length,
        photos: inspection.photos.length,
        voiceNotes: inspection.voiceNotes.length
      },
      roomByRoom: this.groupFindingsByRoom(inspection),
      issues: inspection.issues.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      features: inspection.features,
      tasks: inspection.tasks,
      recommendations: await this.generateRecommendations(inspection)
    };
    
    return report;
  }

  // Group findings by room
  groupFindingsByRoom(inspection) {
    const rooms = {};
    
    // Group issues by room
    inspection.issues.forEach(issue => {
      const room = issue.room || 'General';
      if (!rooms[room]) {
        rooms[room] = { issues: [], features: [], measurements: [] };
      }
      rooms[room].issues.push(issue);
    });
    
    // Group features by room
    inspection.features.forEach(feature => {
      const room = feature.room || 'General';
      if (!rooms[room]) {
        rooms[room] = { issues: [], features: [], measurements: [] };
      }
      rooms[room].features.push(feature);
    });
    
    // Group measurements by room
    inspection.measurements.forEach(measurement => {
      const room = measurement.room || 'General';
      if (!rooms[room]) {
        rooms[room] = { issues: [], features: [], measurements: [] };
      }
      rooms[room].measurements.push(measurement);
    });
    
    return rooms;
  }

  // Generate AI recommendations
  async generateRecommendations(inspection) {
    if (!this.openai) {
      return [
        'Address urgent repairs immediately',
        'Schedule routine maintenance for identified issues',
        'Highlight positive features in marketing materials'
      ];
    }
    
    try {
      const issuesSummary = inspection.issues.map(i => i.description).join('; ');
      const featuresSummary = inspection.features.map(f => f.description).join('; ');
      
      const prompt = `Based on this property inspection, provide 3-5 actionable recommendations:
Issues found: ${issuesSummary || 'None'}
Positive features: ${featuresSummary || 'None'}

Provide recommendations for the real estate agent to maximize property value and appeal.`;

      const completion = await this.openai.createChatCompletion({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a real estate expert providing property improvement recommendations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });
      
      const recommendations = completion.data.choices[0].message.content
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, ''));
      
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [
        'Address urgent repairs immediately',
        'Schedule routine maintenance for identified issues',
        'Highlight positive features in marketing materials'
      ];
    }
  }

  // Get inspection by ID
  getInspection(inspectionId) {
    return this.inspections.get(inspectionId);
  }

  // Get all tasks from queue
  getTasks() {
    return this.actionQueue;
  }

  // Mark task as completed
  completeTask(taskId) {
    const taskIndex = this.actionQueue.findIndex(t => t.id === taskId);
    if (taskIndex !== -1) {
      this.actionQueue[taskIndex].status = 'completed';
      this.actionQueue[taskIndex].completedAt = new Date();
      return true;
    }
    return false;
  }
}

// Singleton instance
let voiceInstance = null;

export const getVoiceToAction = () => {
  if (!voiceInstance) {
    voiceInstance = new VoiceToAction();
    voiceInstance.initialize();
  }
  return voiceInstance;
};

export default VoiceToAction;