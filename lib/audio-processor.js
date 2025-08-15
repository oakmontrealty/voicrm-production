// Advanced Audio Processing for VoiCRM Calling System
// Implements noise suppression, echo cancellation, and audio enhancement

class AudioProcessor {
  constructor() {
    this.audioContext = null;
    this.sourceNode = null;
    this.destinationNode = null;
    this.processors = {};
    this.isProcessing = false;
    this.settings = {
      noiseSupression: true,
      echoCancellation: true,
      autoGainControl: true,
      noiseSuppression: true,
      voiceEnhancement: true,
      backgroundNoiseLevel: 0.3,
      voiceFrequencyRange: { min: 85, max: 255 }, // Human voice frequency range in Hz
      agcTarget: -20, // Target dB for AGC
      agcMaxGain: 30, // Maximum gain in dB
    };
  }

  async initialize() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Initialize processors
      await this.setupNoiseSupression();
      await this.setupEchoCancellation();
      await this.setupAutoGainControl();
      await this.setupVoiceEnhancement();
      
      console.log('Audio processor initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize audio processor:', error);
      return false;
    }
  }

  async setupNoiseSupression() {
    if (!this.audioContext) return;

    // Create noise suppression filter chain
    const highPassFilter = this.audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.value = 80; // Remove low frequency noise

    const lowPassFilter = this.audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    lowPassFilter.frequency.value = 8000; // Remove high frequency noise

    // Create spectral gate for noise suppression
    const spectralGate = this.audioContext.createScriptProcessor(4096, 1, 1);
    spectralGate.onaudioprocess = (e) => {
      if (this.settings.noiseSupression) {
        this.applySpectralGating(e);
      }
    };

    this.processors.noiseSupression = {
      highPass: highPassFilter,
      lowPass: lowPassFilter,
      spectralGate: spectralGate
    };
  }

  async setupEchoCancellation() {
    if (!this.audioContext) return;

    // Create delay node for echo detection
    const delayNode = this.audioContext.createDelay(1.0);
    delayNode.delayTime.value = 0.0;

    // Create dynamics compressor to reduce echo
    const compressor = this.audioContext.createDynamicsCompressor();
    compressor.threshold.value = -50;
    compressor.knee.value = 40;
    compressor.ratio.value = 12;
    compressor.attack.value = 0;
    compressor.release.value = 0.25;

    this.processors.echoCancellation = {
      delay: delayNode,
      compressor: compressor
    };
  }

  async setupAutoGainControl() {
    if (!this.audioContext) return;

    // Create gain node for AGC
    const gainNode = this.audioContext.createGain();
    gainNode.gain.value = 1.0;

    // Create analyzer for level detection
    const analyzer = this.audioContext.createAnalyser();
    analyzer.fftSize = 2048;
    analyzer.smoothingTimeConstant = 0.8;

    // Monitor audio levels and adjust gain
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const adjustGain = () => {
      if (!this.settings.autoGainControl || !this.isProcessing) return;

      analyzer.getByteFrequencyData(dataArray);
      
      // Calculate average volume
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      const targetLevel = 128; // Target average level (0-255 scale)
      
      // Adjust gain based on current level
      const currentGain = gainNode.gain.value;
      const adjustment = (targetLevel - average) / targetLevel * 0.1; // Gradual adjustment
      const newGain = Math.max(0.1, Math.min(currentGain + adjustment, 3.0)); // Limit gain range
      
      gainNode.gain.setValueAtTime(newGain, this.audioContext.currentTime);
      
      requestAnimationFrame(adjustGain);
    };

    this.processors.autoGainControl = {
      gain: gainNode,
      analyzer: analyzer,
      adjustGain: adjustGain
    };
  }

  async setupVoiceEnhancement() {
    if (!this.audioContext) return;

    // Create equalizer for voice enhancement
    const frequencies = [100, 200, 400, 800, 1600, 3200, 6400];
    const gains = [0, 2, 4, 6, 4, 2, 0]; // Boost mid frequencies where voice is prominent
    
    const filters = frequencies.map((freq, i) => {
      const filter = this.audioContext.createBiquadFilter();
      filter.type = i === 0 ? 'lowshelf' : i === frequencies.length - 1 ? 'highshelf' : 'peaking';
      filter.frequency.value = freq;
      filter.gain.value = gains[i];
      filter.Q.value = 1;
      return filter;
    });

    // Connect filters in series
    for (let i = 0; i < filters.length - 1; i++) {
      filters[i].connect(filters[i + 1]);
    }

    this.processors.voiceEnhancement = {
      filters: filters,
      input: filters[0],
      output: filters[filters.length - 1]
    };
  }

  applySpectralGating(audioProcessingEvent) {
    const inputBuffer = audioProcessingEvent.inputBuffer;
    const outputBuffer = audioProcessingEvent.outputBuffer;
    
    for (let channel = 0; channel < outputBuffer.numberOfChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Apply spectral gating algorithm
      for (let sample = 0; sample < inputBuffer.length; sample++) {
        const amplitude = Math.abs(inputData[sample]);
        
        // Gate out low amplitude signals (noise)
        if (amplitude < this.settings.backgroundNoiseLevel) {
          outputData[sample] = inputData[sample] * 0.1; // Reduce noise
        } else {
          outputData[sample] = inputData[sample]; // Pass through voice
        }
      }
    }
  }

  async processAudioStream(stream) {
    if (!this.audioContext) {
      await this.initialize();
    }

    try {
      // Create source from stream
      this.sourceNode = this.audioContext.createMediaStreamSource(stream);
      
      // Create destination for processed audio
      this.destinationNode = this.audioContext.createMediaStreamDestination();
      
      // Build processing chain
      let currentNode = this.sourceNode;
      
      // Apply noise suppression
      if (this.settings.noiseSupression && this.processors.noiseSupression) {
        currentNode.connect(this.processors.noiseSupression.highPass);
        this.processors.noiseSupression.highPass.connect(this.processors.noiseSupression.lowPass);
        this.processors.noiseSupression.lowPass.connect(this.processors.noiseSupression.spectralGate);
        currentNode = this.processors.noiseSupression.spectralGate;
      }
      
      // Apply echo cancellation
      if (this.settings.echoCancellation && this.processors.echoCancellation) {
        currentNode.connect(this.processors.echoCancellation.compressor);
        currentNode = this.processors.echoCancellation.compressor;
      }
      
      // Apply voice enhancement
      if (this.settings.voiceEnhancement && this.processors.voiceEnhancement) {
        currentNode.connect(this.processors.voiceEnhancement.input);
        currentNode = this.processors.voiceEnhancement.output;
      }
      
      // Apply auto gain control
      if (this.settings.autoGainControl && this.processors.autoGainControl) {
        currentNode.connect(this.processors.autoGainControl.gain);
        this.processors.autoGainControl.gain.connect(this.processors.autoGainControl.analyzer);
        currentNode = this.processors.autoGainControl.gain;
        
        // Start AGC monitoring
        this.isProcessing = true;
        this.processors.autoGainControl.adjustGain();
      }
      
      // Connect to destination
      currentNode.connect(this.destinationNode);
      
      console.log('Audio processing chain established');
      return this.destinationNode.stream;
      
    } catch (error) {
      console.error('Failed to process audio stream:', error);
      return stream; // Return original stream if processing fails
    }
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Audio processor settings updated:', this.settings);
  }

  getAudioStats() {
    if (!this.processors.autoGainControl?.analyzer) {
      return null;
    }

    const analyzer = this.processors.autoGainControl.analyzer;
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyzer.getByteFrequencyData(dataArray);

    // Calculate various audio metrics
    const average = dataArray.reduce((a, b) => a + b) / bufferLength;
    const max = Math.max(...dataArray);
    const min = Math.min(...dataArray);
    
    // Detect voice activity
    const voiceFreqStart = Math.floor(85 * bufferLength / (this.audioContext.sampleRate / 2));
    const voiceFreqEnd = Math.floor(255 * bufferLength / (this.audioContext.sampleRate / 2));
    const voiceData = dataArray.slice(voiceFreqStart, voiceFreqEnd);
    const voiceLevel = voiceData.reduce((a, b) => a + b) / voiceData.length;
    
    return {
      averageLevel: average,
      peakLevel: max,
      noiseFloor: min,
      voiceActivity: voiceLevel > 50,
      voiceLevel: voiceLevel,
      gain: this.processors.autoGainControl?.gain?.gain?.value || 1.0
    };
  }

  destroy() {
    this.isProcessing = false;
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
    }
    
    if (this.audioContext) {
      this.audioContext.close();
    }
    
    console.log('Audio processor destroyed');
  }
}

// WebRTC configuration for optimal call quality
const getOptimalWebRTCConfig = () => {
  return {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ],
    iceTransportPolicy: 'all',
    bundlePolicy: 'max-bundle',
    rtcpMuxPolicy: 'require',
    sdpSemantics: 'unified-plan'
  };
};

// Audio constraints for high quality calls
const getAudioConstraints = (settings = {}) => {
  return {
    audio: {
      echoCancellation: settings.echoCancellation !== false,
      noiseSuppression: settings.noiseSuppression !== false,
      autoGainControl: settings.autoGainControl !== false,
      sampleRate: 48000,
      sampleSize: 16,
      channelCount: 1,
      latency: 0.01,
      volume: 1.0
    },
    video: false
  };
};

// Export for use in calling system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    AudioProcessor,
    getOptimalWebRTCConfig,
    getAudioConstraints
  };
}

// Make available globally
window.AudioProcessor = AudioProcessor;
window.getOptimalWebRTCConfig = getOptimalWebRTCConfig;
window.getAudioConstraints = getAudioConstraints;