// VoiCRM Professional - Twilio Voice SDK Integration
// August 13, 2025 - Production Implementation

class TwilioVoiceManager {
    constructor() {
        this.device = null;
        this.currentCall = null;
        this.isDeviceReady = false;
        this.callTimer = 0;
        this.callInterval = null;
        this.onCallStateChange = null;
        this.onDeviceReady = null;
        
        this.init();
    }
    
    async init() {
        try {
            console.log('Initializing Twilio Voice SDK...');
            await this.loadTwilioSDK();
            await this.initializeDevice();
        } catch (error) {
            console.error('Failed to initialize Twilio:', error);
            this.handleInitializationError(error);
        }
    }
    
    async loadTwilioSDK() {
        return new Promise((resolve, reject) => {
            if (window.Twilio?.Device) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://sdk.twilio.com/js/voice/releases/2.11.1/twilio.min.js';
            script.onload = () => {
                console.log('Twilio SDK loaded successfully');
                resolve();
            };
            script.onerror = () => {
                reject(new Error('Failed to load Twilio SDK'));
            };
            document.head.appendChild(script);
        });
    }
    
    async initializeDevice() {
        try {
            // Get access token from server
            const accessToken = await this.getAccessToken();
            
            // Initialize Twilio Device
            this.device = new Twilio.Device(accessToken, {
                logLevel: 1,
                answerOnBridge: true,
                allowIncomingWhileBusy: false,
                closeProtection: true,
                sounds: {
                    incoming: true,
                    outgoing: true,
                    disconnect: true
                }
            });
            
            // Setup device event listeners
            this.setupDeviceEvents();
            
            // Register device
            await this.device.register();
            
        } catch (error) {
            console.error('Device initialization failed:', error);
            throw error;
        }
    }
    
    setupDeviceEvents() {
        // Device ready
        this.device.on('ready', () => {
            console.log('Twilio Device Ready');
            this.isDeviceReady = true;
            if (this.onDeviceReady) {
                this.onDeviceReady();
            }
            this.showToast('VoIP system ready', 'success');
        });
        
        // Device error
        this.device.on('error', (error) => {
            console.error('Twilio Device Error:', error);
            this.showToast(`VoIP Error: ${error.message}`, 'error');
        });
        
        // Incoming call
        this.device.on('incoming', (call) => {
            console.log('Incoming call received');
            this.handleIncomingCall(call);
        });
        
        // Device offline
        this.device.on('offline', () => {
            console.log('Device went offline');
            this.isDeviceReady = false;
            this.showToast('VoIP system offline', 'warning');
        });
        
        // Token will expire
        this.device.on('tokenWillExpire', () => {
            console.log('Token will expire, refreshing...');
            this.refreshToken();
        });
    }
    
    async getAccessToken() {
        try {
            // In production, this would call your server endpoint
            const response = await fetch('/api/twilio/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    identity: `voicrm_user_${Date.now()}`
                })
            });
            
            if (!response.ok) {
                throw new Error('Failed to get access token');
            }
            
            const data = await response.json();
            return data.token;
            
        } catch (error) {
            console.error('Token fetch failed:', error);
            // Fallback to demo mode for development
            return this.generateDemoToken();
        }
    }
    
    generateDemoToken() {
        // This is for demo purposes only - in production, tokens must be generated server-side
        console.warn('Using demo token - implement server-side token generation for production');
        return 'demo-access-token-' + Date.now();
    }
    
    async refreshToken() {
        try {
            const newToken = await this.getAccessToken();
            this.device.updateToken(newToken);
            console.log('Token refreshed successfully');
        } catch (error) {
            console.error('Token refresh failed:', error);
            this.showToast('Failed to refresh VoIP token', 'error');
        }
    }
    
    // Make outbound call
    async makeCall(phoneNumber, contactName = null) {
        if (!this.isDeviceReady) {
            this.showToast('VoIP system not ready', 'error');
            return false;
        }
        
        if (this.currentCall) {
            this.showToast('Call already in progress', 'warning');
            return false;
        }
        
        try {
            console.log('Making call to:', phoneNumber);
            
            // Connect to phone number
            const call = await this.device.connect({
                params: {
                    To: phoneNumber,
                    ContactName: contactName || phoneNumber
                }
            });
            
            this.setupCallEvents(call);
            this.currentCall = call;
            
            this.showToast(`Calling ${contactName || phoneNumber}...`, 'info');
            
            return true;
            
        } catch (error) {
            console.error('Failed to make call:', error);
            this.showToast(`Call failed: ${error.message}`, 'error');
            return false;
        }
    }
    
    setupCallEvents(call) {
        // Call accepted/connected
        call.on('accept', () => {
            console.log('Call accepted');
            this.startCallTimer();
            this.updateCallState('connected');
            this.showToast('Call connected', 'success');
            this.showActiveCallUI();
        });
        
        // Call disconnected
        call.on('disconnect', () => {
            console.log('Call disconnected');
            this.endCall();
        });
        
        // Call rejected
        call.on('reject', () => {
            console.log('Call rejected');
            this.endCall();
            this.showToast('Call rejected', 'info');
        });
        
        // Call error
        call.on('error', (error) => {
            console.error('Call error:', error);
            this.endCall();
            this.showToast(`Call error: ${error.message}`, 'error');
        });
        
        // Call ringing
        call.on('ringing', () => {
            console.log('Call ringing');
            this.updateCallState('ringing');
        });
        
        // Call warning (quality issues)
        call.on('warning', (name, data) => {
            console.warn('Call quality warning:', name, data);
            this.handleCallQualityWarning(name, data);
        });
        
        // Warning cleared
        call.on('warning-cleared', (name) => {
            console.log('Call quality warning cleared:', name);
            this.handleCallQualityCleared(name);
        });
    }
    
    showActiveCallUI() {
        // Create active call interface
        const activeCallHtml = `
            <div id="active-call-modal" class="active-call-modal">
                <div class="active-call-content">
                    <div class="call-info">
                        <div class="call-contact" id="call-contact-name">Active Call</div>
                        <div class="call-timer" id="call-duration">00:00</div>
                        <div class="call-quality" id="call-quality-indicator">Crystal Clear</div>
                    </div>
                    <div class="call-controls">
                        <button class="call-control-btn mute-btn" onclick="voiceManager.toggleMute()" id="mute-btn">
                            🔇 Mute
                        </button>
                        <button class="call-control-btn hold-btn" onclick="voiceManager.toggleHold()" id="hold-btn">
                            ⏸️ Hold
                        </button>
                        <button class="call-control-btn hangup-btn" onclick="voiceManager.hangUp()">
                            📞 Hang Up
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Remove existing modal if any
        this.hideActiveCallUI();
        
        document.body.insertAdjacentHTML('beforeend', activeCallHtml);
    }
    
    hideActiveCallUI() {
        const modal = document.getElementById('active-call-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    // Hang up current call
    hangUp() {
        if (this.currentCall) {
            console.log('Hanging up call');
            this.currentCall.disconnect();
        } else {
            console.warn('No active call to hang up');
            this.showToast('No active call to hang up', 'warning');
        }
    }
    
    // Accept incoming call
    acceptCall() {
        if (this.currentCall && this.currentCall.status() === 'pending') {
            console.log('Accepting incoming call');
            this.currentCall.accept();
            this.hideIncomingCallUI();
        }
    }
    
    // Reject incoming call
    rejectCall() {
        if (this.currentCall && this.currentCall.status() === 'pending') {
            console.log('Rejecting incoming call');
            this.currentCall.reject();
            this.hideIncomingCallUI();
        }
    }
    
    // Mute/unmute call
    toggleMute() {
        if (this.currentCall) {
            const isMuted = this.currentCall.isMuted();
            this.currentCall.mute(!isMuted);
            console.log('Call mute toggled:', !isMuted);
            
            const muteBtn = document.getElementById('mute-btn');
            if (muteBtn) {
                muteBtn.textContent = isMuted ? '🔇 Mute' : '🔊 Unmute';
                muteBtn.style.background = isMuted ? '' : 'linear-gradient(135deg, #dc3545, #c82333)';
            }
            
            this.showToast(isMuted ? 'Call unmuted' : 'Call muted', 'info');
            return !isMuted;
        }
        return false;
    }
    
    // Hold/unhold call
    toggleHold() {
        if (this.currentCall) {
            const isOnHold = this.currentCall.isOnHold();
            isOnHold ? this.currentCall.unhold() : this.currentCall.hold();
            console.log('Call hold toggled:', !isOnHold);
            
            const holdBtn = document.getElementById('hold-btn');
            if (holdBtn) {
                holdBtn.textContent = isOnHold ? '⏸️ Hold' : '▶️ Resume';
                holdBtn.style.background = isOnHold ? '' : 'linear-gradient(135deg, #ffc107, #e0a800)';
            }
            
            this.showToast(isOnHold ? 'Call resumed' : 'Call on hold', 'info');
            return !isOnHold;
        }
        return false;
    }
    
    // Send DTMF tones
    sendDigits(digits) {
        if (this.currentCall) {
            this.currentCall.sendDigits(digits);
            console.log('Sent DTMF digits:', digits);
        }
    }
    
    startCallTimer() {
        this.callTimer = 0;
        this.callInterval = setInterval(() => {
            this.callTimer++;
            this.updateCallTimer();
        }, 1000);
    }
    
    updateCallTimer() {
        const minutes = Math.floor(this.callTimer / 60);
        const seconds = this.callTimer % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Update UI elements
        const timerElements = document.querySelectorAll('.call-timer, #call-duration');
        timerElements.forEach(el => {
            el.textContent = timeString;
        });
    }
    
    endCall() {
        if (this.callInterval) {
            clearInterval(this.callInterval);
            this.callInterval = null;
        }
        
        const callDuration = this.formatCallDuration(this.callTimer);
        
        this.currentCall = null;
        this.callTimer = 0;
        this.updateCallState('ended');
        
        // Hide call UIs
        this.hideActiveCallUI();
        this.hideIncomingCallUI();
        
        console.log('Call ended, duration:', callDuration);
        this.showToast(`Call ended - Duration: ${callDuration}`, 'info');
        
        // Log call to CRM
        this.logCallToCRM(callDuration);
    }
    
    formatCallDuration(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    handleIncomingCall(call) {
        this.currentCall = call;
        this.setupCallEvents(call);
        
        // Show incoming call UI
        this.showIncomingCallUI(call);
        
        // Play ringtone or show notification
        this.playIncomingRingtone();
    }
    
    showIncomingCallUI(call) {
        const callerInfo = call.parameters?.From || 'Unknown';
        
        // Create incoming call modal/notification
        const incomingCallHtml = `
            <div id="incoming-call-modal" class="incoming-call-modal">
                <div class="incoming-call-content">
                    <div class="caller-info">
                        <div class="caller-name">Incoming Call</div>
                        <div class="caller-number">${callerInfo}</div>
                    </div>
                    <div class="call-actions">
                        <button class="accept-btn" onclick="voiceManager.acceptCall()">
                            📞 Accept
                        </button>
                        <button class="reject-btn" onclick="voiceManager.rejectCall()">
                            📞 Decline
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', incomingCallHtml);
    }
    
    hideIncomingCallUI() {
        const modal = document.getElementById('incoming-call-modal');
        if (modal) {
            modal.remove();
        }
    }
    
    playIncomingRingtone() {
        // Play browser notification sound or custom ringtone
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Incoming Call', {
                body: 'You have an incoming call',
                icon: '/assets/icons/phone-icon.png'
            });
        }
    }
    
    handleCallQualityWarning(name, data) {
        console.warn('Call quality issue:', name, data);
        
        const warnings = {
            'high-rtt': 'High latency detected',
            'high-jitter': 'Audio quality may be affected',
            'low-mos': 'Poor call quality',
            'packet-loss': 'Network connectivity issues'
        };
        
        const message = warnings[name] || `Call quality warning: ${name}`;
        this.showToast(message, 'warning');
        
        // Update quality indicator
        const qualityIndicator = document.getElementById('call-quality-indicator');
        if (qualityIndicator) {
            qualityIndicator.textContent = 'Quality Issues';
            qualityIndicator.style.color = '#ffc107';
        }
    }
    
    handleCallQualityCleared(name) {
        console.log('Call quality improved:', name);
        this.showToast('Call quality improved', 'success');
        
        // Update quality indicator
        const qualityIndicator = document.getElementById('call-quality-indicator');
        if (qualityIndicator) {
            qualityIndicator.textContent = 'Crystal Clear';
            qualityIndicator.style.color = '#28a745';
        }
    }
    
    updateCallState(state) {
        if (this.onCallStateChange) {
            this.onCallStateChange(state, this.currentCall);
        }
        
        // Update UI based on call state
        const callStatus = document.getElementById('call-status-indicator');
        if (callStatus) {
            const statusText = callStatus.querySelector('.status-text');
            const statusMap = {
                ringing: 'Ringing...',
                connected: 'Connected',
                ended: 'Ready',
                muted: 'Muted',
                onhold: 'On Hold'
            };
            
            if (statusText) {
                statusText.textContent = statusMap[state] || 'Ready';
            }
            
            callStatus.className = `status-indicator status-${state}`;
        }
    }
    
    logCallToCRM(duration) {
        // Log call details to CRM system
        const callData = {
            duration: duration,
            timestamp: new Date().toISOString(),
            type: 'outbound',
            // Add more call metadata
        };
        
        console.log('Logging call to CRM:', callData);
        
        // Add to activity feed if available
        if (window.app && window.app.addActivityItem) {
            window.app.addActivityItem('call', `Call completed - Duration: ${duration}`, 'just now');
            window.app.updateMetrics();
        }
    }
    
    handleInitializationError(error) {
        console.error('Twilio initialization failed:', error);
        
        // Show fallback UI or demo mode
        this.showToast('VoIP system unavailable - using demo mode', 'warning');
        
        // Set up demo mode
        this.setupDemoMode();
    }
    
    setupDemoMode() {
        console.log('Setting up demo mode');
        this.isDeviceReady = true;
        
        if (this.onDeviceReady) {
            this.onDeviceReady();
        }
        
        // Override methods for demo
        this.makeCall = this.demoMakeCall.bind(this);
        this.hangUp = this.demoHangUp.bind(this);
    }
    
    async demoMakeCall(phoneNumber, contactName) {
        console.log('Demo: Making call to', phoneNumber);
        this.updateCallState('ringing');
        this.showToast(`Demo: Calling ${contactName || phoneNumber}...`, 'info');
        
        // Simulate call connection
        setTimeout(() => {
            this.updateCallState('connected');
            this.startCallTimer();
            this.showActiveCallUI();
            this.showToast('Demo: Call connected', 'success');
            
            // Update contact name in UI
            const contactNameEl = document.getElementById('call-contact-name');
            if (contactNameEl) {
                contactNameEl.textContent = contactName || phoneNumber;
            }
            
        }, 2000);
        
        return true;
    }
    
    demoHangUp() {
        console.log('Demo: Hanging up call');
        this.endCall();
    }
    
    showToast(message, type = 'info') {
        // Use the app's toast system if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        } else {
            console.log(`Toast [${type}]: ${message}`);
        }
    }
    
    // Get call statistics
    getCallStats() {
        if (this.currentCall) {
            return this.currentCall.getStats();
        }
        return null;
    }
    
    // Get device status
    getDeviceStatus() {
        return {
            isReady: this.isDeviceReady,
            isOnCall: !!this.currentCall,
            callDuration: this.callTimer,
            deviceState: this.device ? this.device.state : 'disconnected'
        };
    }
    
    // Destroy device (cleanup)
    destroy() {
        if (this.callInterval) {
            clearInterval(this.callInterval);
        }
        
        if (this.currentCall) {
            this.currentCall.disconnect();
        }
        
        if (this.device) {
            this.device.destroy();
        }
        
        this.hideIncomingCallUI();
        this.hideActiveCallUI();
        
        console.log('Twilio Voice Manager destroyed');
    }
}

// Initialize global voice manager
let voiceManager;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    voiceManager = new TwilioVoiceManager();
    
    // Make it globally available
    window.voiceManager = voiceManager;
    
    // Setup callbacks for the main app
    voiceManager.onDeviceReady = () => {
        console.log('Voice system ready');
        if (window.app) {
            window.app.voiceSystemReady = true;
            window.app.showToast('Voice system ready', 'success');
        }
    };
    
    voiceManager.onCallStateChange = (state, call) => {
        console.log('Call state changed:', state);
        if (window.app) {
            window.app.handleCallStateChange && window.app.handleCallStateChange(state, call);
        }
    };
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TwilioVoiceManager;
}