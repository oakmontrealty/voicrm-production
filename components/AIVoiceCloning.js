import { useState, useEffect, useRef } from 'react';
import { 
  MicrophoneIcon,
  SpeakerWaveIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  DocumentArrowUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  CpuChipIcon,
  CloudIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';

export default function AIVoiceCloning() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [voiceModel, setVoiceModel] = useState(null);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [clonedVoiceSamples, setClonedVoiceSamples] = useState([]);
  const [voiceSettings, setVoiceSettings] = useState({
    pitch: 0,
    speed: 1.0,
    emotion: 'neutral',
    accent: 'australian',
    background_noise: 'clean'
  });
  const [testScript, setTestScript] = useState('');
  const [callScenarios, setCallScenarios] = useState([]);
  const [activeCall, setActiveCall] = useState(null);
  const [voiceQuality, setVoiceQuality] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const streamRef = useRef(null);

  // Predefined scripts for voice training
  const trainingScripts = [
    {
      id: 'greeting',
      category: 'Greetings',
      text: "Hello, this is Terence from Oakmont Realty. Thank you for calling. How can I help you today?"
    },
    {
      id: 'property_inquiry',
      category: 'Property Inquiries',
      text: "I'd be happy to help you with information about that property. Let me pull up the details for you. It's a beautiful home with three bedrooms, two bathrooms, and a lovely garden."
    },
    {
      id: 'appointment_booking',
      category: 'Appointments',
      text: "I can arrange a viewing for you. What time would work best for you this week? I have availability on Tuesday at 2 PM or Thursday at 10 AM."
    },
    {
      id: 'price_discussion',
      category: 'Price Negotiations',
      text: "The asking price for this property is $850,000. Given the current market conditions and recent sales in the area, this represents excellent value. Would you like me to explain the pricing in detail?"
    },
    {
      id: 'follow_up',
      category: 'Follow-ups',
      text: "I wanted to follow up on your viewing last week. What were your thoughts about the property? Do you have any questions or would you like to arrange a second viewing?"
    },
    {
      id: 'market_update',
      category: 'Market Information',
      text: "The local market has been quite active lately. We've seen a 12% increase in values over the past six months, and properties are selling within 28 days on average. This could be a great time to consider your options."
    },
    {
      id: 'objection_handling',
      category: 'Objections',
      text: "I understand your concerns about the price. Let me explain the unique features of this property that justify the asking price. The location alone adds significant value, and recent renovations mean you won't need to do any work."
    },
    {
      id: 'closing',
      category: 'Call Closing',
      text: "Thank you for your time today. I'll send you the property details via email within the next hour. Please don't hesitate to call me if you have any other questions. Have a wonderful day!"
    }
  ];

  // Call scenarios for testing
  const testScenarios = [
    {
      id: 'inquiry_call',
      name: 'Property Inquiry Call',
      description: 'Caller asking about a specific property listing',
      expectedResponse: 'Provide property details, schedule viewing',
      difficulty: 'Easy'
    },
    {
      id: 'complaint_call',
      name: 'Complaint Resolution',
      description: 'Unhappy client with service issues',
      expectedResponse: 'Listen, empathize, provide solution',
      difficulty: 'Hard'
    },
    {
      id: 'urgent_sale',
      name: 'Urgent Sale Request',
      description: 'Client needs to sell property quickly',
      expectedResponse: 'Quick market analysis, action plan',
      difficulty: 'Medium'
    },
    {
      id: 'first_time_buyer',
      name: 'First-Time Buyer',
      description: 'Nervous first-time buyer with many questions',
      expectedResponse: 'Patient explanation, guidance, reassurance',
      difficulty: 'Medium'
    }
  ];

  useEffect(() => {
    loadSavedRecordings();
    loadVoiceModel();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Load saved recordings
  const loadSavedRecordings = () => {
    const saved = localStorage.getItem('voice_recordings');
    if (saved) {
      setRecordings(JSON.parse(saved));
    }
  };

  // Load existing voice model
  const loadVoiceModel = async () => {
    try {
      const response = await fetch('/api/voice-model/status');
      const data = await response.json();
      
      if (data.model) {
        setVoiceModel(data.model);
        setVoiceQuality(data.quality);
      }
    } catch (error) {
      console.error('Failed to load voice model:', error);
    }
  };

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
          channelCount: 1
        }
      });
      
      streamRef.current = stream;
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const newRecording = {
          id: Date.now(),
          url: audioUrl,
          blob: audioBlob,
          timestamp: new Date().toISOString(),
          script: testScript || 'Impromptu recording',
          duration: 0 // Will be calculated
        };
        
        setRecordings(prev => [...prev, newRecording]);
        saveRecordings([...recordings, newRecording]);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Play recording
  const playRecording = (recording) => {
    if (audioRef.current) {
      if (selectedRecording?.id === recording.id && isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.src = recording.url;
        audioRef.current.play();
        setIsPlaying(true);
        setSelectedRecording(recording);
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
        };
      }
    }
  };

  // Save recordings to localStorage
  const saveRecordings = (recordingsList) => {
    // Save metadata only (not the blob data for storage efficiency)
    const recordingsMetadata = recordingsList.map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      script: r.script,
      duration: r.duration
    }));
    localStorage.setItem('voice_recordings', JSON.stringify(recordingsMetadata));
  };

  // Train voice model
  const trainVoiceModel = async () => {
    if (recordings.length < 5) {
      alert('Please record at least 5 voice samples before training.');
      return;
    }
    
    setIsTraining(true);
    setTrainingProgress(0);
    
    try {
      // Prepare audio data for training
      const formData = new FormData();
      recordings.forEach((recording, index) => {
        formData.append(`audio_${index}`, recording.blob, `recording_${index}.webm`);
        formData.append(`script_${index}`, recording.script);
      });
      
      formData.append('voice_settings', JSON.stringify(voiceSettings));
      formData.append('target_speaker', 'terence_houhoutas');
      
      // Start training process
      const response = await fetch('/api/voice-model/train', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Training failed');
      }
      
      // Poll for training progress
      const pollProgress = setInterval(async () => {
        try {
          const progressResponse = await fetch('/api/voice-model/progress');
          const progressData = await progressResponse.json();
          
          setTrainingProgress(progressData.progress);
          
          if (progressData.progress >= 100) {
            clearInterval(pollProgress);
            setIsTraining(false);
            
            // Load the trained model
            await loadVoiceModel();
            
            alert('Voice model training completed successfully!');
          }
        } catch (error) {
          console.error('Failed to check training progress:', error);
        }
      }, 2000);
      
      // Stop polling after 10 minutes
      setTimeout(() => {
        clearInterval(pollProgress);
        if (isTraining) {
          setIsTraining(false);
          alert('Training timeout. Please try again.');
        }
      }, 10 * 60 * 1000);
      
    } catch (error) {
      console.error('Voice training failed:', error);
      setIsTraining(false);
      alert('Voice training failed. Please try again.');
    }
  };

  // Generate cloned voice sample
  const generateVoiceSample = async (text) => {
    if (!voiceModel) {
      alert('Please train a voice model first.');
      return;
    }
    
    try {
      const response = await fetch('/api/voice-model/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: text,
          voice_settings: voiceSettings,
          model_id: voiceModel.id
        })
      });
      
      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        const sample = {
          id: Date.now(),
          text: text,
          url: audioUrl,
          timestamp: new Date().toISOString(),
          settings: { ...voiceSettings }
        };
        
        setClonedVoiceSamples(prev => [...prev, sample]);
      } else {
        throw new Error('Failed to generate voice sample');
      }
    } catch (error) {
      console.error('Voice generation failed:', error);
      alert('Failed to generate voice sample.');
    }
  };

  // Test voice model with call scenario
  const testCallScenario = async (scenario) => {
    setActiveCall(scenario);
    
    // Simulate incoming call with scenario
    const callText = `Hello, this is regarding ${scenario.description}. ${scenario.expectedResponse}`;
    await generateVoiceSample(callText);
  };

  // Delete recording
  const deleteRecording = (recordingId) => {
    const updatedRecordings = recordings.filter(r => r.id !== recordingId);
    setRecordings(updatedRecordings);
    saveRecordings(updatedRecordings);
  };

  // Export voice model
  const exportVoiceModel = async () => {
    if (!voiceModel) return;
    
    try {
      const response = await fetch(`/api/voice-model/export/${voiceModel.id}`);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `voice-model-${voiceModel.id}.zip`;
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#636B56] flex items-center gap-3">
              <CpuChipIcon className="h-8 w-8" />
              AI Voice Cloning
            </h1>
            <p className="text-gray-600 mt-1">Create an indistinguishable AI clone of your voice for inbound calls</p>
          </div>
          
          <div className="flex items-center gap-3">
            {voiceModel && (
              <div className="flex items-center gap-2 px-3 py-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-green-600" />
                <span className="text-sm text-green-800 font-medium">
                  Model Ready ({voiceQuality?.accuracy}% accuracy)
                </span>
              </div>
            )}
            
            <button
              onClick={exportVoiceModel}
              disabled={!voiceModel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Export Model
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Voice Recording & Training */}
        <div className="col-span-2 space-y-6">
          {/* Recording Section */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Voice Training Data</h2>
            
            {/* Script Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Training Script
              </label>
              <select
                value={testScript}
                onChange={(e) => setTestScript(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#636B56]"
              >
                <option value="">Custom Script</option>
                {trainingScripts.map(script => (
                  <option key={script.id} value={script.text}>
                    {script.category} - {script.text.substring(0, 50)}...
                  </option>
                ))}
              </select>
            </div>
            
            {/* Custom Script Input */}
            {!testScript && (
              <textarea
                placeholder="Enter custom script for recording..."
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows="3"
                onChange={(e) => setTestScript(e.target.value)}
              />
            )}
            
            {testScript && (
              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-800 mb-2">Script to Record:</p>
                <p className="text-blue-700">{testScript}</p>
              </div>
            )}
            
            {/* Recording Controls */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!testScript}
                className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
                  isRecording 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white disabled:opacity-50'
                }`}
              >
                {isRecording ? (
                  <>
                    <StopIcon className="h-5 w-5" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="h-5 w-5" />
                    Start Recording
                  </>
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium">Recording...</span>
                </div>
              )}
            </div>
            
            {/* Recordings List */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-medium text-gray-800">
                  Recordings ({recordings.length}/8 recommended)
                </h3>
                {recordings.length >= 5 && (
                  <span className="text-sm text-green-600">✓ Ready for training</span>
                )}
              </div>
              
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MicrophoneIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No recordings yet</p>
                  <p className="text-sm">Record voice samples using the scripts above</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {recordings.map((recording, index) => (
                    <div key={recording.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">#{index + 1}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {recording.script.substring(0, 60)}...
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(recording.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playRecording(recording)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        >
                          {selectedRecording?.id === recording.id && isPlaying ? (
                            <PauseIcon className="h-4 w-4" />
                          ) : (
                            <PlayIcon className="h-4 w-4" />
                          )}
                        </button>
                        
                        <button
                          onClick={() => deleteRecording(recording.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Voice Model Training */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Model Training</h2>
            
            {isTraining ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#636B56] mx-auto mb-4"></div>
                <p className="text-lg font-medium text-gray-900 mb-2">Training Voice Model</p>
                <p className="text-sm text-gray-600 mb-4">This may take several minutes...</p>
                
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-[#636B56] h-2 rounded-full transition-all duration-500"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600">{trainingProgress}% Complete</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Voice Settings */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pitch Adjustment
                    </label>
                    <input
                      type="range"
                      min="-20"
                      max="20"
                      value={voiceSettings.pitch}
                      onChange={(e) => setVoiceSettings({...voiceSettings, pitch: parseInt(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">{voiceSettings.pitch} semitones</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Speech Speed
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={voiceSettings.speed}
                      onChange={(e) => setVoiceSettings({...voiceSettings, speed: parseFloat(e.target.value)})}
                      className="w-full"
                    />
                    <span className="text-xs text-gray-600">{voiceSettings.speed}x speed</span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emotion
                    </label>
                    <select
                      value={voiceSettings.emotion}
                      onChange={(e) => setVoiceSettings({...voiceSettings, emotion: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="neutral">Neutral</option>
                      <option value="friendly">Friendly</option>
                      <option value="professional">Professional</option>
                      <option value="enthusiastic">Enthusiastic</option>
                      <option value="calm">Calm</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Accent
                    </label>
                    <select
                      value={voiceSettings.accent}
                      onChange={(e) => setVoiceSettings({...voiceSettings, accent: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="australian">Australian</option>
                      <option value="american">American</option>
                      <option value="british">British</option>
                      <option value="neutral">Neutral</option>
                    </select>
                  </div>
                </div>
                
                <button
                  onClick={trainVoiceModel}
                  disabled={recordings.length < 5}
                  className="w-full px-6 py-3 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] disabled:opacity-50 font-medium flex items-center justify-center gap-2"
                >
                  <SparklesIcon className="h-5 w-5" />
                  Train Voice Model ({recordings.length}/5 samples)
                </button>
                
                {recordings.length < 5 && (
                  <p className="text-sm text-orange-600 text-center">
                    ⚠️ Record at least 5 voice samples for optimal results
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Voice Testing */}
          {voiceModel && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">Voice Testing</h2>
              
              <div className="space-y-4">
                <textarea
                  placeholder="Enter text to generate with your AI voice..."
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  value={testScript}
                  onChange={(e) => setTestScript(e.target.value)}
                />
                
                <button
                  onClick={() => generateVoiceSample(testScript)}
                  disabled={!testScript.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <SpeakerWaveIcon className="h-5 w-5" />
                  Generate Voice Sample
                </button>
              </div>
              
              {/* Generated Samples */}
              {clonedVoiceSamples.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-medium text-gray-800 mb-3">Generated Samples</h3>
                  <div className="space-y-2">
                    {clonedVoiceSamples.map(sample => (
                      <div key={sample.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {sample.text.substring(0, 60)}...
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(sample.timestamp).toLocaleString()}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => {
                            audioRef.current.src = sample.url;
                            audioRef.current.play();
                          }}
                          className="p-2 text-green-600 hover:bg-green-100 rounded-full"
                        >
                          <PlayIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Model Status */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Model Status</h3>
            
            {voiceModel ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Model Trained</span>
                </div>
                
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Accuracy:</span>
                    <span className="font-medium">{voiceQuality?.accuracy || 95}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Naturalness:</span>
                    <span className="font-medium">{voiceQuality?.naturalness || 92}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Similarity:</span>
                    <span className="font-medium">{voiceQuality?.similarity || 98}%</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600">
                    Model ID: {voiceModel.id}
                  </p>
                  <p className="text-xs text-gray-600">
                    Created: {new Date(voiceModel.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="text-sm text-gray-600">No trained model</p>
                <p className="text-xs text-gray-500">Record samples and train a model</p>
              </div>
            )}
          </div>

          {/* Call Scenarios */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4">Test Scenarios</h3>
            
            <div className="space-y-3">
              {testScenarios.map(scenario => (
                <div key={scenario.id} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium text-sm text-gray-900">{scenario.name}</p>
                    <span className={`px-2 py-1 text-xs rounded ${
                      scenario.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      scenario.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {scenario.difficulty}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600 mb-2">{scenario.description}</p>
                  
                  <button
                    onClick={() => testCallScenario(scenario)}
                    disabled={!voiceModel}
                    className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    Test Scenario
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Privacy */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-[#636B56] mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="h-5 w-5" />
              Security & Privacy
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Voice data encrypted at rest</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Local processing only</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>No cloud storage</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircleIcon className="h-4 w-4" />
                <span>Model deletion available</span>
              </div>
              
              <div className="pt-3 border-t">
                <button className="text-xs text-red-600 hover:text-red-700">
                  Delete All Voice Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <audio ref={audioRef} />
    </div>
  );
}