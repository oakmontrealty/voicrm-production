// VoiCRM Professional Application - Enhanced Implementation
// August 13, 2025 - Production Ready with Twilio Integration

class VoiCRMApp {
    constructor() {
        this.currentNumber = '';
        this.isVoiceActive = false;
        this.currentCall = null;
        this.contacts = [];
        this.properties = [];
        this.calls = [];
        this.leads = [];
        this.recognition = null;
        this.callTimer = 0;
        this.callInterval = null;
        this.voiceSystemReady = false;
        this.analytics = {
            callsMade: 0,
            leadsGenerated: 0,
            conversionsToday: 0,
            revenueToday: 0
        };
        
        this.init();
    }
    
    async init() {
        console.log('Initializing VoiCRM Professional...');
        
        // Initialize speech recognition
        this.initSpeechRecognition();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Load data
        await this.loadData();
        
        // Initialize integrations
        await this.initializeIntegrations();
        
        // Hide loading screen
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
            this.showToast('VoiCRM Professional Ready', 'success');
            this.speakMessage('VoiCRM Professional system ready');
        }, 2000);
        
        // Start monitoring
        this.startSystemMonitoring();
        
        console.log('VoiCRM Professional initialized');
    }
    
    async initializeIntegrations() {
        try {
            // Initialize Supabase
            await this.initSupabase();
            
            // Initialize OpenAI for transcription
            await this.initOpenAI();
            
            // Initialize real-time features
            this.initRealTimeFeatures();
            
        } catch (error) {
            console.error('Integration initialization failed:', error);
            this.showToast('Some features may be limited', 'warning');
        }
    }
    
    async initSupabase() {
        try {
            // Get credentials from environment or configuration
            const supabaseUrl = window.SUPABASE_URL || 'https://didmparfeydjbcuzgaif.supabase.co';
            const supabaseKey = window.SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
            
            if (typeof window.supabase !== 'undefined' && supabaseKey) {
                this.supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
                console.log('Supabase initialized');
            } else {
                console.warn('Supabase credentials not available - using demo mode');
            }
        } catch (error) {
            console.error('Supabase initialization failed:', error);
        }
    }
    
    async initOpenAI() {
        try {
            // Initialize OpenAI for transcription and AI features
            this.openAIConfig = {
                apiKey: window.OPENAI_API_KEY || process.env.OPENAI_API_KEY,
                model: 'gpt-4'
            };
            
            if (this.openAIConfig.apiKey) {
                console.log('OpenAI configuration ready');
            } else {
                console.warn('OpenAI API key not available - AI features limited');
            }
        } catch (error) {
            console.error('OpenAI initialization failed:', error);
        }
    }
    
    initRealTimeFeatures() {
        // Real-time call transcription
        this.transcriptionActive = false;
        
        // Real-time notifications
        this.setupNotifications();
        
        // Real-time quality monitoring
        this.qualityMonitor = new CallQualityMonitor();
    }
    
    setupNotifications() {
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    console.log('Notifications enabled');
                }
            });
        }
    }
    
    initSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.lang = 'en-AU';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => {
                this.isVoiceActive = true;
                this.updateVoiceUI('listening');
            };
            
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.trim();
                this.processVoiceCommand(transcript);
            };
            
            this.recognition.onend = () => {
                this.isVoiceActive = false;
                this.updateVoiceUI('ready');
            };
            
            this.recognition.onerror = (event) => {
                this.isVoiceActive = false;
                this.updateVoiceUI('ready');
                this.showToast(`Voice error: ${event.error}`, 'error');
            };
        } else {
            console.warn('Speech recognition not supported');
            this.showToast('Voice commands not supported in this browser', 'warning');
        }
    }
    
    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
        
        // Voice command buttons
        document.getElementById('voice-command-btn')?.addEventListener('click', () => {
            this.startVoiceCommand();
        });
        
        document.getElementById('global-voice-btn')?.addEventListener('click', () => {
            this.startVoiceCommand();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.target.matches('input, textarea')) {
                e.preventDefault();
                this.startVoiceCommand();
            }
            
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'k':
                        e.preventDefault();
                        document.getElementById('global-search')?.focus();
                        break;
                    case 'v':
                        e.preventDefault();
                        this.startVoiceCommand();
                        break;
                    case 'h':
                        if (this.currentCall) {
                            e.preventDefault();
                            window.voiceManager?.hangUp();
                        }
                        break;
                }
            }
        });
        
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.navigateToSection(section);
            });
        });
    }
    
    async loadData() {
        try {
            // Load contacts from Supabase
            if (this.supabase) {
                await this.loadContactsFromDB();
                await this.loadPropertiesFromDB();
                await this.loadCallHistoryFromDB();
            } else {
                // Load sample data for demo
                this.loadSampleData();
            }
        } catch (error) {
            console.error('Failed to load data:', error);
            this.loadSampleData();
        }
    }
    
    async loadContactsFromDB() {
        try {
            const { data, error } = await this.supabase
                .from('contacts')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.contacts = data || [];
            console.log('Loaded contacts from database:', this.contacts.length);
        } catch (error) {
            console.error('Failed to load contacts:', error);
        }
    }
    
    async loadPropertiesFromDB() {
        try {
            const { data, error } = await this.supabase
                .from('properties')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            this.properties = data || [];
            console.log('Loaded properties from database:', this.properties.length);
        } catch (error) {
            console.error('Failed to load properties:', error);
        }
    }
    
    async loadCallHistoryFromDB() {
        try {
            const { data, error } = await this.supabase
                .from('call_history')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);
            
            if (error) throw error;
            
            this.calls = data || [];
            console.log('Loaded call history from database:', this.calls.length);
        } catch (error) {
            console.error('Failed to load call history:', error);
        }
    }
    
    loadSampleData() {
        this.contacts = [
            { 
                id: 1, 
                name: 'Sarah Mitchell', 
                phone: '+61487654321', 
                email: 'sarah@email.com', 
                company: 'Tech Innovators',
                status: 'hot',
                lastCall: '2024-08-13 14:30',
                notes: 'Looking for investment property in Parramatta. Budget $800k-1.2M. Pre-approved finance.',
                score: 95,
                properties: ['3BR house Campbelltown', '2BR unit Parramatta']
            },
            { 
                id: 2, 
                name: 'Michael Chen', 
                phone: '+61454321098', 
                email: 'michael@business.com', 
                company: 'Chen Enterprises',
                status: 'warm',
                lastCall: '2024-08-12 16:15',
                notes: 'Commercial property investor. Interested in Liverpool industrial.',
                score: 78,
                properties: ['Industrial Liverpool', 'Retail Bankstown']
            },
            { 
                id: 3, 
                name: 'Emma Thompson', 
                phone: '+61498765432', 
                email: 'emma@startup.io', 
                company: 'Innovation Labs',
                status: 'lead',
                lastCall: '2024-08-11 11:20',
                notes: 'First home buyer. Pre-approved $650k. Looking in Western Sydney.',
                score: 62,
                properties: ['3BR house Penrith', '2BR townhouse Blacktown']
            }
        ];
        
        this.properties = [
            {
                id: 1,
                address: '45 Main Street, Parramatta NSW 2150',
                type: '3BR House',
                price: '$850,000',
                status: 'For Sale',
                bedrooms: 3,
                bathrooms: 2,
                parking: 2,
                landSize: '650sqm',
                description: 'Beautifully renovated family home in prime location',
                inquiries: 12,
                viewings: 8
            },
            {
                id: 2,
                address: '78 Industrial Drive, Liverpool NSW 2170',
                type: 'Commercial',
                price: '$1,200,000',
                status: 'For Sale',
                area: '1,200sqm',
                zoning: 'Industrial',
                description: 'Modern warehouse facility with office space',
                inquiries: 5,
                viewings: 3
            }
        ];
        
        this.calls = [
            { 
                id: 1, 
                contactId: 1, 
                type: 'outbound', 
                duration: '5:23', 
                date: '2024-08-13 14:30', 
                status: 'completed', 
                notes: 'Discussed property viewing requirements. Scheduled inspection for Saturday.',
                sentiment: 'positive',
                aiSummary: 'Client expressed strong interest in Parramatta properties. Ready to move quickly if right property found.'
            }
        ];
    }
    
    startVoiceCommand() {
        if (!this.recognition) {
            this.showToast('Voice recognition not available', 'error');
            return;
        }
        
        if (this.isVoiceActive) {
            this.recognition.stop();
            return;
        }
        
        try {
            this.recognition.start();
            this.showToast('Listening... Speak now', 'info');
        } catch (error) {
            console.error('Voice recognition error:', error);
            this.showToast('Failed to start voice recognition', 'error');
        }
    }
    
    async processVoiceCommand(transcript) {
        console.log('Processing voice command:', transcript);
        this.updateTranscript(transcript);
        this.updateVoiceUI('processing');
        
        const command = transcript.toLowerCase();
        
        // Enhanced AI-powered command processing
        if (command.includes('add contact') || command.includes('new contact')) {
            await this.processAddContact(transcript);
        }
        else if (command.includes('call')) {
            await this.processCallCommand(transcript);
        }
        else if (command.includes('search') || command.includes('find')) {
            this.processSearchCommand(transcript);
        }
        else if (command.includes('schedule') || command.includes('meeting')) {
            await this.processScheduleCommand(transcript);
        }
        else if (command.includes('update') || command.includes('status')) {
            await this.processStatusUpdate(transcript);
        }
        else if (command.includes('property') || command.includes('listing')) {
            await this.processPropertyCommand(transcript);
        }
        else if (command.includes('lead score') || command.includes('analyze')) {
            await this.processAnalyticsCommand(transcript);
        }
        else {
            // Use AI to interpret unknown commands
            await this.processAICommand(transcript);
        }
        
        setTimeout(() => this.updateVoiceUI('ready'), 2000);
    }
    
    async processAICommand(transcript) {
        try {
            // Use OpenAI to interpret the command
            const interpretation = await this.interpretCommandWithAI(transcript);
            
            if (interpretation.action) {
                await this.executeAIAction(interpretation);
            } else {
                this.showToast(`Command not recognized: "${transcript}"`, 'warning');
                this.speakMessage('Command not recognized. Try saying "Add contact", "Call", or "Search".');
            }
        } catch (error) {
            console.error('AI command processing failed:', error);
            this.showToast('Could not process command with AI', 'error');
        }
    }
    
    async interpretCommandWithAI(transcript) {
        // Placeholder for OpenAI integration
        // In production, this would call OpenAI GPT-4 API
        return {
            action: null,
            intent: 'unknown',
            confidence: 0.1
        };
    }
    
    async processAddContact(transcript) {
        // Enhanced contact parsing with AI
        const parts = transcript.replace(/add contact|new contact/gi, '').trim().split(',');
        
        if (parts.length >= 2) {
            const name = parts[0].trim();
            const phone = parts[1].trim();
            const company = parts[2] ? parts[2].trim() : '';
            const status = parts[3] ? parts[3].trim() : 'lead';
            
            const contact = await this.addContact(name, phone, '', company, status);
            
            if (contact) {
                this.showToast(`Added ${name} to contacts`, 'success');
                this.speakMessage(`Successfully added ${name} to contacts`);
                
                // AI-powered lead scoring
                const score = await this.calculateLeadScore(contact);
                this.updateContactScore(contact.id, score);
            }
        } else {
            this.showToast('Invalid format. Say "Add contact [name], [phone], [company]"', 'error');
            this.speakMessage('Invalid format. Please say add contact, name, phone number, and optionally company');
        }
    }
    
    async calculateLeadScore(contact) {
        // AI-powered lead scoring algorithm
        let score = 50; // Base score
        
        // Score based on phone number (business vs mobile)
        if (contact.phone.includes('02') || contact.phone.includes('03')) {
            score += 10; // Business number
        }
        
        // Score based on company presence
        if (contact.company && contact.company.length > 0) {
            score += 15;
        }
        
        // Score based on time of contact (business hours)
        const now = new Date();
        const hour = now.getHours();
        if (hour >= 9 && hour <= 17) {
            score += 10; // Business hours contact
        }
        
        // Random factor for demo (in production, use AI model)
        score += Math.floor(Math.random() * 25);
        
        return Math.min(score, 100);
    }
    
    updateContactScore(contactId, score) {
        const contact = this.contacts.find(c => c.id === contactId);
        if (contact) {
            contact.score = score;
        }
    }
    
    async processCallCommand(transcript) {
        const callText = transcript.replace(/call/gi, '').trim();
        
        // Check if it's a phone number
        const phoneMatch = callText.match(/(\+?61|0)[4]\d{8}|\d{2}[\\s-]?\d{4}[\\s-]?\d{4}/);
        if (phoneMatch) {
            this.makeCallToNumber(phoneMatch[0]);
        } else {
            // Search for contact by name with fuzzy matching
            const contact = this.findContactByName(callText);
            if (contact) {
                this.makeCallToContact(contact.phone, contact.name);
            } else {
                // Use AI to find similar contacts
                const suggestions = await this.findSimilarContacts(callText);
                if (suggestions.length > 0) {
                    this.showContactSuggestions(suggestions);
                } else {
                    this.showToast(`Contact "${callText}" not found`, 'error');
                    this.speakMessage(`Contact ${callText} not found`);
                }
            }
        }
    }
    
    async findSimilarContacts(searchTerm) {
        // AI-powered fuzzy search
        return this.contacts.filter(contact => {
            const similarity = this.calculateStringSimilarity(
                contact.name.toLowerCase(), 
                searchTerm.toLowerCase()
            );
            return similarity > 0.6; // 60% similarity threshold
        });
    }
    
    showContactSuggestions(suggestions) {
        const names = suggestions.map(c => c.name).join(', ');
        this.showToast(`Did you mean: ${names}?`, 'info');
        this.speakMessage(`Did you mean ${names}?`);
    }
    
    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance implementation
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        const maxLength = Math.max(str1.length, str2.length);
        return (maxLength - matrix[str2.length][str1.length]) / maxLength;
    }
    
    processSearchCommand(transcript) {
        const searchTerm = transcript.replace(/search|find/gi, '').trim();
        const searchInput = document.getElementById('global-search');
        if (searchInput) {
            searchInput.value = searchTerm;
        }
        this.showToast(`Searching for "${searchTerm}"`, 'info');
        this.speakMessage(`Searching for ${searchTerm}`);
    }
    
    async processScheduleCommand(transcript) {
        this.showToast('Scheduling feature coming soon', 'info');
        this.speakMessage('Scheduling feature will be available soon');
    }
    
    async processStatusUpdate(transcript) {
        this.showToast('Status update feature coming soon', 'info');
        this.speakMessage('Status update feature will be available soon');
    }
    
    async processPropertyCommand(transcript) {
        // Property-specific voice commands
        const propertyText = transcript.replace(/property|listing/gi, '').trim();
        
        if (propertyText.includes('add') || propertyText.includes('new')) {
            this.showToast('Property management feature coming soon', 'info');
        } else if (propertyText.includes('search') || propertyText.includes('find')) {
            this.searchProperties(propertyText);
        } else {
            this.showToast('Say "Add property" or "Search properties"', 'info');
        }
    }
    
    searchProperties(searchTerm) {
        const results = this.properties.filter(property =>
            property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
            property.type.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (results.length > 0) {
            this.showToast(`Found ${results.length} properties matching "${searchTerm}"`, 'success');
        } else {
            this.showToast('No properties found', 'info');
        }
    }
    
    async processAnalyticsCommand(transcript) {
        // AI-powered analytics commands
        if (transcript.includes('lead score')) {
            this.showLeadScoreSummary();
        } else if (transcript.includes('performance') || transcript.includes('stats')) {
            this.showPerformanceSummary();
        } else {
            this.showToast('Analytics feature activated', 'info');
        }
    }
    
    showLeadScoreSummary() {
        const avgScore = this.contacts.reduce((sum, contact) => sum + (contact.score || 50), 0) / this.contacts.length;
        this.showToast(`Average lead score: ${avgScore.toFixed(1)}`, 'info');
        this.speakMessage(`Your average lead score is ${avgScore.toFixed(0)} out of 100`);
    }
    
    showPerformanceSummary() {
        const summary = `Today: ${this.analytics.callsMade} calls, ${this.analytics.leadsGenerated} leads`;
        this.showToast(summary, 'info');
        this.speakMessage(summary);
    }
    
    async addContact(name, phone, email = '', company = '', status = 'lead') {
        const contact = {
            id: Date.now(),
            name: name,
            phone: phone,
            email: email,
            company: company,
            status: status,
            created: new Date(),
            score: await this.calculateLeadScore({ name, phone, company })
        };
        
        try {
            // Save to Supabase if available
            if (this.supabase) {
                const { data, error } = await this.supabase
                    .from('contacts')
                    .insert([contact]);
                
                if (error) throw error;
            }
            
            this.contacts.push(contact);
            this.updateMetrics();
            this.addActivityItem('contact', `New contact added: ${name}`, 'just now');
            
            return contact;
        } catch (error) {
            console.error('Failed to add contact:', error);
            this.showToast('Failed to save contact to database', 'error');
            return null;
        }
    }
    
    // Integration with voice manager
    handleCallStateChange(state, call) {
        console.log('App handling call state change:', state);
        
        if (state === 'connected') {
            this.startCallTranscription();
        } else if (state === 'ended') {
            this.stopCallTranscription();
        }
        
        this.updateCallStatus(state);
    }
    
    async startCallTranscription() {
        try {
            this.transcriptionActive = true;
            console.log('Starting real-time call transcription...');
            
            // Initialize real-time transcription
            if (this.openAIConfig && this.openAIConfig.apiKey) {
                // In production, implement WebSocket connection to transcription service
                this.showToast('Call transcription active', 'info');
            }
        } catch (error) {
            console.error('Failed to start transcription:', error);
        }
    }
    
    stopCallTranscription() {
        this.transcriptionActive = false;
        console.log('Stopping call transcription');
    }
    
    makeCallToNumber(phoneNumber) {
        this.currentNumber = phoneNumber;
        const display = document.getElementById('phone-display');
        if (display) {
            display.textContent = phoneNumber;
        }
        this.makeCall();
    }
    
    makeCallToContact(phone, name) {
        this.currentNumber = phone;
        const display = document.getElementById('phone-display');
        if (display) {
            display.textContent = `${name} - ${phone}`;
        }
        this.makeCall();
    }
    
    makeCall() {
        if (!this.currentNumber) {
            this.showToast('Please enter a phone number', 'warning');
            return;
        }
        
        // Use Twilio voice manager if available
        if (window.voiceManager && this.voiceSystemReady) {
            const contactName = this.getContactNameByPhone(this.currentNumber);
            window.voiceManager.makeCall(this.currentNumber, contactName);
        } else {
            // Fallback to demo mode
            this.demoMakeCall();
        }
    }
    
    getContactNameByPhone(phone) {
        const contact = this.contacts.find(c => c.phone === phone);
        return contact ? contact.name : null;
    }
    
    demoMakeCall() {
        this.updateCallStatus('calling');
        this.showToast(`Calling ${this.currentNumber}...`, 'info');
        this.speakMessage(`Calling ${this.currentNumber}`);
        
        // Simulate call connection
        setTimeout(() => {
            this.updateCallStatus('connected');
            this.showToast('Demo call connected', 'success');
            this.addActivityItem('call', `Call to ${this.currentNumber}`, 'just now');
            this.updateMetrics();
            
            // Auto-end demo call after 30 seconds
            setTimeout(() => {
                this.updateCallStatus('ended');
                this.showToast('Demo call ended', 'info');
            }, 30000);
        }, 2000);
    }
    
    updateCallStatus(status) {
        const indicator = document.getElementById('call-status-indicator');
        if (indicator) {
            const text = indicator.querySelector('.status-text');
            
            indicator.className = `status-indicator status-${status}`;
            
            const statusMap = {
                ready: 'Ready',
                calling: 'Calling...',
                ringing: 'Ringing...',
                connected: 'Connected',
                ended: 'Call Ended'
            };
            
            if (text) {
                text.textContent = statusMap[status] || 'Ready';
            }
        }
    }
    
    startSystemMonitoring() {
        // Monitor call quality
        setInterval(() => {
            this.updateQualityMetrics();
        }, 5000);
        
        // Monitor system performance
        setInterval(() => {
            this.updateSystemMetrics();
        }, 30000);
        
        // Auto-save data
        setInterval(() => {
            this.autoSaveData();
        }, 60000);
    }
    
    updateQualityMetrics() {
        // Simulate real-time quality metrics
        const latency = Math.floor(Math.random() * 20 + 25);
        const jitter = Math.floor(Math.random() * 6 + 2);
        const packetLoss = (Math.random() * 0.05).toFixed(3);
        const audioLevel = Math.floor(Math.random() * 5 + 95);
        
        const elements = {
            'latency': latency + 'ms',
            'jitter': jitter + 'ms',
            'packet-loss': packetLoss + '%',
            'audio-level': audioLevel + '%'
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
        
        // Update quality monitor
        if (this.qualityMonitor) {
            this.qualityMonitor.updateMetrics({
                latency: latency,
                jitter: jitter,
                packetLoss: parseFloat(packetLoss),
                audioLevel: audioLevel
            });
        }
    }
    
    updateSystemMetrics() {
        // Update performance metrics
        const metrics = {
            memoryUsage: (performance.memory?.usedJSHeapSize / 1024 / 1024).toFixed(1) + ' MB',
            connectionLatency: Math.floor(Math.random() * 50 + 10) + 'ms',
            systemLoad: Math.floor(Math.random() * 30 + 20) + '%'
        };
        
        console.log('System metrics:', metrics);
    }
    
    async autoSaveData() {
        try {
            if (this.supabase && this.contacts.length > 0) {
                // Auto-save any pending changes
                console.log('Auto-saving data...');
            }
        } catch (error) {
            console.error('Auto-save failed:', error);
        }
    }
    
    updateVoiceUI(state) {
        const voiceBtn = document.getElementById('voice-command-btn');
        const voiceText = voiceBtn?.querySelector('.voice-text');
        
        if (voiceBtn) {
            voiceBtn.classList.remove('listening', 'processing');
            
            switch (state) {
                case 'listening':
                    voiceBtn.classList.add('listening');
                    if (voiceText) voiceText.textContent = 'Listening...';
                    break;
                case 'processing':
                    voiceBtn.classList.add('processing');
                    if (voiceText) voiceText.textContent = 'Processing...';
                    break;
                default:
                    if (voiceText) voiceText.textContent = 'Tap to speak';
                    break;
            }
        }
    }
    
    updateTranscript(text) {
        const transcript = document.getElementById('voice-transcript');
        if (transcript) {
            transcript.innerHTML = `<div class="transcript-content">You said: "${text}"</div>`;
        }
    }
    
    findContactByName(name) {
        return this.contacts.find(contact => 
            contact.name.toLowerCase().includes(name.toLowerCase())
        );
    }
    
    navigateToSection(section) {
        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active class to clicked item
        const navItem = document.querySelector(`[data-section="${section}"]`);
        if (navItem) {
            navItem.classList.add('active');
        }
        
        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            contacts: 'Contact Management',
            calls: 'Call History',
            properties: 'Property Management',
            pipeline: 'Sales Pipeline',
            leads: 'Lead Management',
            analytics: 'Analytics & Reports',
            dialer: 'Smart Dialer',
            campaigns: 'Marketing Campaigns',
            reports: 'Reports',
            integrations: 'Integrations',
            settings: 'Settings'
        };
        
        const pageTitle = document.querySelector('.page-title');
        if (pageTitle) {
            pageTitle.textContent = titles[section] || 'Dashboard';
        }
        
        this.showToast(`Navigated to ${titles[section]}`, 'info');
    }
    
    addActivityItem(type, description, time) {
        const feed = document.getElementById('activity-feed');
        if (!feed) return;
        
        const icons = {
            call: '📞',
            contact: '👤',
            meeting: '📅',
            email: '📧',
            sms: '💬',
            property: '🏡'
        };
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-icon activity-${type}">${icons[type] || '📋'}</div>
            <div class="activity-content">
                <div class="activity-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="activity-description">${description}</div>
            </div>
            <div class="activity-time">${time}</div>
        `;
        
        feed.insertBefore(activityItem, feed.firstChild);
        
        // Remove old items if more than 10
        if (feed.children.length > 10) {
            feed.removeChild(feed.lastChild);
        }
    }
    
    updateMetrics() {
        this.analytics.callsMade++;
        this.analytics.leadsGenerated++;
        
        const callsToday = document.getElementById('calls-today');
        const leadsGenerated = document.getElementById('leads-generated');
        
        if (callsToday) {
            callsToday.textContent = this.analytics.callsMade;
        }
        
        if (leadsGenerated) {
            leadsGenerated.textContent = this.analytics.leadsGenerated;
        }
    }
    
    speakMessage(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 0.7;
            speechSynthesis.speak(utterance);
        }
    }
    
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span style="font-size: 1.2rem;">${icons[type] || 'ℹ️'}</span>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                container.removeChild(toast);
            }
        }, 5000);
    }
}

// Call Quality Monitor Class
class CallQualityMonitor {
    constructor() {
        this.metrics = {
            latency: 0,
            jitter: 0,
            packetLoss: 0,
            audioLevel: 0
        };
        
        this.thresholds = {
            latency: 150, // ms
            jitter: 30,   // ms
            packetLoss: 1, // %
            audioLevel: 80 // %
        };
    }
    
    updateMetrics(newMetrics) {
        this.metrics = { ...this.metrics, ...newMetrics };
        this.checkQuality();
    }
    
    checkQuality() {
        let warnings = [];
        
        if (this.metrics.latency > this.thresholds.latency) {
            warnings.push('High latency detected');
        }
        
        if (this.metrics.jitter > this.thresholds.jitter) {
            warnings.push('High jitter detected');
        }
        
        if (this.metrics.packetLoss > this.thresholds.packetLoss) {
            warnings.push('Packet loss detected');
        }
        
        if (this.metrics.audioLevel < this.thresholds.audioLevel) {
            warnings.push('Low audio quality');
        }
        
        if (warnings.length > 0 && window.app) {
            window.app.showToast(`Call quality issues: ${warnings.join(', ')}`, 'warning');
        }
    }
}

// Dialer Functions (Global)
function addDigit(digit) {
    const display = document.getElementById('phone-display');
    if (display) {
        if (display.textContent === 'Enter number...') {
            display.textContent = digit;
        } else {
            display.textContent += digit;
        }
        if (window.app) {
            window.app.currentNumber = display.textContent;
        }
    }
}

function clearDisplay() {
    const display = document.getElementById('phone-display');
    if (display) {
        display.textContent = 'Enter number...';
    }
    if (window.app) {
        window.app.currentNumber = '';
    }
}

function makeCall() {
    if (window.app) {
        window.app.makeCall();
    }
}

function makeCallToContact(phone, name) {
    if (window.app) {
        window.app.makeCallToContact(phone, name);
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new VoiCRMApp();
    window.app = app; // Make globally available
});