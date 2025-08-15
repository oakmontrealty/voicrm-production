// RNNoise Integration for VoiCRM
// Ultra-low latency open-source noise suppression
// Based on Xiph.Org's RNNoise neural network

class RNNoiseProcessor {
  constructor() {
    this.audioContext = null;
    this.rnnoise = null;
    this.processorNode = null;
    this.isInitialized = false;
    this.inputStream = null;
    this.outputStream = null;
  }

  async initialize() {
    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000
      });

      // Load RNNoise WASM module
      await this.loadRNNoiseModule();
      
      // Create script processor for RNNoise (will be replaced with AudioWorklet for lower latency)
      await this.createProcessor();
      
      this.isInitialized = true;
      console.log('RNNoise initialized successfully with ultra-low latency');
      return true;
    } catch (error) {
      console.error('Failed to initialize RNNoise:', error);
      return false;
    }
  }

  async loadRNNoiseModule() {
    // Load RNNoise WebAssembly module
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/rnnoise-wasm@0.2.0/dist/rnnoise.js';
    document.head.appendChild(script);

    return new Promise((resolve, reject) => {
      script.onload = async () => {
        try {
          // Initialize RNNoise WASM
          if (window.RNNoise) {
            this.rnnoise = await window.RNNoise();
            resolve();
          } else {
            // Fallback to manual WASM loading
            await this.loadRNNoiseManually();
            resolve();
          }
        } catch (error) {
          reject(error);
        }
      };
      script.onerror = reject;
    });
  }

  async loadRNNoiseManually() {
    // Manual WASM loading for RNNoise
    const wasmResponse = await fetch('https://cdn.jsdelivr.net/npm/rnnoise-wasm@0.2.0/dist/rnnoise.wasm');
    const wasmBuffer = await wasmResponse.arrayBuffer();
    
    const wasmModule = await WebAssembly.instantiate(wasmBuffer, {
      env: {
        memory: new WebAssembly.Memory({ initial: 256, maximum: 512 }),
        __memory_base: 0,
        __table_base: 0,
        abort: () => console.error('WASM abort'),
        _llvm_stacksave: () => 0,
        _llvm_stackrestore: () => {},
        _emscripten_memcpy_big: (dest, src, num) => {
          const HEAPU8 = new Uint8Array(memory.buffer);
          HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
        }
      }
    });

    this.rnnoise = {
      _rnnoise_create: wasmModule.instance.exports.rnnoise_create,
      _rnnoise_destroy: wasmModule.instance.exports.rnnoise_destroy,
      _rnnoise_process_frame: wasmModule.instance.exports.rnnoise_process_frame,
      HEAPF32: new Float32Array(wasmModule.instance.exports.memory.buffer),
      _malloc: wasmModule.instance.exports.malloc,
      _free: wasmModule.instance.exports.free
    };
  }

  async createProcessor() {
    // Create AudioWorklet for ultra-low latency (< 10ms)
    try {
      await this.audioContext.audioWorklet.addModule('/lib/rnnoise-worklet.js');
      this.processorNode = new AudioWorkletNode(this.audioContext, 'rnnoise-processor', {
        processorOptions: {
          frameSize: 480 // 10ms at 48kHz for minimal latency
        }
      });
    } catch (error) {
      // Fallback to ScriptProcessor (slightly higher latency but still < 20ms)
      console.warn('AudioWorklet not supported, falling back to ScriptProcessor');
      this.createScriptProcessor();
    }
  }

  createScriptProcessor() {
    const bufferSize = 512; // Small buffer for low latency
    this.processorNode = this.audioContext.createScriptProcessor(bufferSize, 1, 1);
    
    // RNNoise state
    const state = this.rnnoise._rnnoise_create();
    const frameSize = 480; // RNNoise frame size
    const frame = this.rnnoise._malloc(frameSize * 4);
    let inputBuffer = new Float32Array(frameSize);
    let outputBuffer = new Float32Array(frameSize);
    
    this.processorNode.onaudioprocess = (e) => {
      const input = e.inputBuffer.getChannelData(0);
      const output = e.outputBuffer.getChannelData(0);
      
      // Process with RNNoise
      for (let i = 0; i < input.length; i += frameSize) {
        const chunkSize = Math.min(frameSize, input.length - i);
        
        // Copy input to WASM memory
        for (let j = 0; j < chunkSize; j++) {
          this.rnnoise.HEAPF32[frame / 4 + j] = input[i + j] * 32768;
        }
        
        // Process frame with RNNoise
        const vad = this.rnnoise._rnnoise_process_frame(state, frame, frame);
        
        // Copy processed output
        for (let j = 0; j < chunkSize; j++) {
          output[i + j] = this.rnnoise.HEAPF32[frame / 4 + j] / 32768;
        }
      }
    };
  }

  async processStream(stream) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Create source from microphone stream
      const source = this.audioContext.createMediaStreamSource(stream);
      
      // Create destination for processed audio
      const destination = this.audioContext.createMediaStreamDestination();
      
      // Connect: Microphone -> RNNoise -> Output
      source.connect(this.processorNode);
      this.processorNode.connect(destination);
      
      // Store references
      this.inputStream = stream;
      this.outputStream = destination.stream;
      
      console.log('RNNoise processing active - ultra-low latency noise suppression enabled');
      return this.outputStream;
    } catch (error) {
      console.error('Failed to process stream with RNNoise:', error);
      return stream; // Return original stream as fallback
    }
  }

  stop() {
    if (this.processorNode) {
      this.processorNode.disconnect();
    }
    if (this.inputStream) {
      this.inputStream.getTracks().forEach(track => track.stop());
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.isInitialized = false;
    console.log('RNNoise stopped');
  }

  // Get processing statistics
  getStats() {
    if (!this.audioContext) return null;
    
    return {
      latency: Math.round(this.audioContext.baseLatency * 1000), // Convert to ms
      sampleRate: this.audioContext.sampleRate,
      state: this.audioContext.state,
      processingTime: this.audioContext.currentTime
    };
  }
}

// Export for use in VoiCRM
if (typeof module !== 'undefined' && module.exports) {
  module.exports = RNNoiseProcessor;
} else {
  window.RNNoiseProcessor = RNNoiseProcessor;
}