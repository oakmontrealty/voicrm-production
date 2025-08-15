import { useState, useEffect, useRef } from 'react';
import { MicrophoneIcon, PlayIcon, StopIcon, TrashIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

export default function VoicemailDrop({ onVoicemailReady, twilioDevice }) {
  const [voicemails, setVoicemails] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoicemail, setSelectedVoicemail] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);
  const audioPlayerRef = useRef(new Audio());

  // Default voicemail templates
  const defaultTemplates = [
    {
      id: 'intro_1',
      name: 'Professional Introduction',
      text: "Hi, this is [Your Name] from VoiCRM Real Estate. I'm calling regarding your property interests. I have some exciting opportunities that match your criteria. Please call me back at your earliest convenience. Thank you!",
      duration: 15,
      category: 'introduction'
    },
    {
      id: 'follow_up_1',
      name: 'Follow-up Message',
      text: "Hi [Contact Name], following up on our previous conversation about properties in your preferred area. I've found some new listings that might interest you. Please give me a call back when you have a moment. Thanks!",
      duration: 12,
      category: 'follow_up'
    },
    {
      id: 'appointment_1',
      name: 'Appointment Reminder',
      text: "Hi [Contact Name], this is a reminder about our scheduled property viewing tomorrow. Please confirm if you're still available. If you need to reschedule, just give me a call. Looking forward to showing you the property!",
      duration: 13,
      category: 'appointment'
    },
    {
      id: 'market_update_1',
      name: 'Market Update',
      text: "Hi, I wanted to share some important market updates that could affect your property value. There have been significant changes in your area. Please call me back to discuss how this impacts your real estate goals.",
      duration: 14,
      category: 'market_update'
    },
    {
      id: 'urgent_1',
      name: 'Urgent Opportunity',
      text: "Hi [Contact Name], an incredible opportunity just came on the market that perfectly matches what you're looking for. This won't last long. Please call me back as soon as possible so we don't miss out. Thank you!",
      duration: 11,
      category: 'urgent'
    }
  ];

  // Load saved voicemails from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('voicemail_templates');
    if (saved) {
      setVoicemails(JSON.parse(saved));
    } else {
      // Initialize with default templates
      setVoicemails(defaultTemplates);
      localStorage.setItem('voicemail_templates', JSON.stringify(defaultTemplates));
    }
  }, []);

  // Start recording a new voicemail
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      audioChunksRef.current = [];
      
      const options = { mimeType: 'audio/webm;codecs=opus' };
      mediaRecorderRef.current = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        saveVoicemail(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Auto-stop after 60 seconds
      setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          stopRecording();
        }
      }, 60000);

    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(recordingIntervalRef.current);
    }
  };

  // Save recorded voicemail
  const saveVoicemail = async (audioBlob) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Audio = reader.result;
      const newVoicemail = {
        id: `custom_${Date.now()}`,
        name: `Recording ${new Date().toLocaleString()}`,
        audio: base64Audio,
        duration: recordingTime,
        category: 'custom',
        createdAt: new Date().toISOString()
      };

      const updated = [...voicemails, newVoicemail];
      setVoicemails(updated);
      localStorage.setItem('voicemail_templates', JSON.stringify(updated));
      
      // Auto-select the new recording
      setSelectedVoicemail(newVoicemail.id);
      
      if (onVoicemailReady) {
        onVoicemailReady(newVoicemail);
      }
    };
    reader.readAsDataURL(audioBlob);
  };

  // Play voicemail preview
  const playVoicemail = (voicemail) => {
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
      return;
    }

    if (voicemail.audio) {
      audioPlayerRef.current.src = voicemail.audio;
      audioPlayerRef.current.play();
      setIsPlaying(true);
      
      audioPlayerRef.current.onended = () => {
        setIsPlaying(false);
      };
    } else if (voicemail.text) {
      // Use text-to-speech for template messages
      const utterance = new SpeechSynthesisUtterance(voicemail.text);
      speechSynthesis.speak(utterance);
      setIsPlaying(true);
      
      utterance.onend = () => {
        setIsPlaying(false);
      };
    }
  };

  // Delete voicemail
  const deleteVoicemail = (id) => {
    const updated = voicemails.filter(v => v.id !== id);
    setVoicemails(updated);
    localStorage.setItem('voicemail_templates', JSON.stringify(updated));
    
    if (selectedVoicemail === id) {
      setSelectedVoicemail(null);
    }
  };

  // Drop voicemail in active call
  const dropVoicemail = async () => {
    if (!selectedVoicemail || !twilioDevice) {
      alert('Please select a voicemail and ensure you have an active call');
      return;
    }

    const voicemail = voicemails.find(v => v.id === selectedVoicemail);
    if (!voicemail) return;

    try {
      // Send voicemail to Twilio
      const response = await fetch('/api/twilio/drop-voicemail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voicemailId: voicemail.id,
          audioUrl: voicemail.audio,
          text: voicemail.text,
          callSid: twilioDevice.activeCall()?.parameters.CallSid
        })
      });

      if (response.ok) {
        console.log('Voicemail dropped successfully');
        
        // Disconnect the call after dropping voicemail
        if (twilioDevice.activeCall()) {
          setTimeout(() => {
            twilioDevice.disconnectAll();
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error dropping voicemail:', error);
    }
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-bold text-[#636B56] mb-4">Voicemail Drop</h3>
      
      {/* Recording Controls */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 flex items-center gap-2"
            >
              <MicrophoneIcon className="h-5 w-5" />
              Record New Voicemail
            </button>
          ) : (
            <>
              <button
                onClick={stopRecording}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center gap-2 animate-pulse"
              >
                <StopIcon className="h-5 w-5" />
                Stop Recording
              </button>
              <span className="text-red-500 font-mono font-bold text-xl">
                {formatTime(recordingTime)}
              </span>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-gray-600">Recording...</span>
              </div>
            </>
          )}
        </div>
        
        {isRecording && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-500 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${Math.min((recordingTime / 60) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Maximum 60 seconds</p>
          </div>
        )}
      </div>

      {/* Voicemail Templates */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Voicemail Templates</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {voicemails.map(voicemail => (
            <div
              key={voicemail.id}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                selectedVoicemail === voicemail.id 
                  ? 'border-[#636B56] bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedVoicemail(voicemail.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {selectedVoicemail === voicemail.id && (
                      <CheckCircleIcon className="h-5 w-5 text-[#636B56]" />
                    )}
                    <span className="font-medium text-sm">{voicemail.name}</span>
                    <span className="px-2 py-1 text-xs bg-gray-100 rounded">
                      {voicemail.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatTime(voicemail.duration)}
                    </span>
                  </div>
                  {voicemail.text && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {voicemail.text}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playVoicemail(voicemail);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                  
                  {voicemail.category === 'custom' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteVoicemail(voicemail.id);
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drop Voicemail Button */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-sm font-medium text-gray-700">
            {selectedVoicemail 
              ? `Selected: ${voicemails.find(v => v.id === selectedVoicemail)?.name}`
              : 'No voicemail selected'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Will automatically disconnect after dropping voicemail
          </p>
        </div>
        
        <button
          onClick={dropVoicemail}
          disabled={!selectedVoicemail}
          className="px-6 py-3 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
        >
          Drop Voicemail
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <strong>Pro Tip:</strong> Record multiple voicemails for different scenarios. 
          When you detect an answering machine, simply select a template and click "Drop Voicemail" 
          to leave your message and move to the next call automatically.
        </p>
      </div>
    </div>
  );
}

// Voicemail detection component
export function VoicemailDetector({ onDetected }) {
  const [isListening, setIsListening] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const silenceTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);

  const startDetection = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      
      analyserRef.current.fftSize = 2048;
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      setIsListening(true);
      let silenceStart = null;
      let beepDetected = false;
      
      const checkAudio = () => {
        if (!isListening) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Detect typical voicemail patterns
        // 1. Long silence followed by beep
        // 2. Consistent tone (music/hold)
        // 3. Robotic voice patterns
        
        if (average < 10) {
          // Silence detected
          if (!silenceStart) {
            silenceStart = Date.now();
          } else if (Date.now() - silenceStart > 3000) {
            // 3+ seconds of silence = likely voicemail
            setConfidence(70);
          }
        } else {
          silenceStart = null;
          
          // Check for beep frequency (typically 1000-2000 Hz)
          const beepRange = dataArray.slice(46, 93); // ~1000-2000 Hz range
          const beepAverage = beepRange.reduce((a, b) => a + b) / beepRange.length;
          
          if (beepAverage > 200 && average < 50) {
            beepDetected = true;
            setConfidence(90);
          }
        }
        
        // If high confidence of voicemail, trigger callback
        if (confidence > 80 && !beepDetected) {
          if (onDetected) {
            onDetected(confidence);
          }
        }
        
        requestAnimationFrame(checkAudio);
      };
      
      checkAudio();
      
    } catch (error) {
      console.error('Error starting voicemail detection:', error);
    }
  };

  const stopDetection = () => {
    setIsListening(false);
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  return (
    <div className="p-3 bg-yellow-50 rounded-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-yellow-800">
            Voicemail Detection {isListening ? 'Active' : 'Inactive'}
          </p>
          {isListening && (
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-yellow-600">Confidence:</span>
                <div className="w-32 bg-yellow-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-600 h-2 rounded-full transition-all"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
                <span className="text-xs text-yellow-600">{confidence}%</span>
              </div>
            </div>
          )}
        </div>
        
        <button
          onClick={isListening ? stopDetection : startDetection}
          className={`px-3 py-1 rounded text-sm ${
            isListening 
              ? 'bg-yellow-600 text-white hover:bg-yellow-700' 
              : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
          }`}
        >
          {isListening ? 'Stop' : 'Start'} Detection
        </button>
      </div>
    </div>
  );
}