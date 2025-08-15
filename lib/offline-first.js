// UNFAIR ADVANTAGE: Offline-First Architecture with Auto-Recovery
class OfflineFirstSystem {
  constructor() {
    this.isOnline = navigator.onLine;
    this.pendingOperations = new Map();
    this.syncQueue = [];
    this.retryAttempts = new Map();
    this.maxRetries = 5;
    this.baseDelay = 1000;
    this.localDB = null;
    
    this.init();
  }

  async init() {
    // Initialize IndexedDB for offline storage
    await this.initializeLocalDB();
    
    // Setup service worker for background sync
    await this.registerServiceWorker();
    
    // Setup network monitoring
    this.setupNetworkMonitoring();
    
    // Setup automatic sync on reconnection
    this.setupAutoSync();
    
    // Load pending operations from storage
    await this.loadPendingOperations();
    
    console.log('🔥 Offline-First System initialized - UNFAIR ADVANTAGE ACTIVE');
  }

  async initializeLocalDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('VoiCRM_OfflineDB', 3);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.localDB = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Contacts store
        if (!db.objectStoreNames.contains('contacts')) {
          const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
          contactStore.createIndex('email', 'email', { unique: false });
          contactStore.createIndex('phone', 'phone', { unique: false });
        }
        
        // Pending operations store
        if (!db.objectStoreNames.contains('pending_operations')) {
          const pendingStore = db.createObjectStore('pending_operations', { keyPath: 'id' });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          pendingStore.createIndex('type', 'type', { unique: false });
        }
        
        // Call logs store
        if (!db.objectStoreNames.contains('call_logs')) {
          const callStore = db.createObjectStore('call_logs', { keyPath: 'id' });
          callStore.createIndex('contact_id', 'contact_id', { unique: false });
          callStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // AI cache store
        if (!db.objectStoreNames.contains('ai_cache')) {
          const aiStore = db.createObjectStore('ai_cache', { keyPath: 'key' });
          aiStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Sync queue store
        if (!db.objectStoreNames.contains('sync_queue')) {
          const syncStore = db.createObjectStore('sync_queue', { keyPath: 'id' });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('retry_count', 'retry_count', { unique: false });
        }
      };
    });
  }

  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Listen for background sync events
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
          registration.sync.register('background-sync');
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      console.log('🌐 Network reconnected - Starting sync...');
      this.isOnline = true;
      this.processPendingOperations();
    });
    
    window.addEventListener('offline', () => {
      console.log('📡 Network disconnected - Offline mode activated');
      this.isOnline = false;
    });
  }

  setupAutoSync() {
    // Sync every 30 seconds when online
    setInterval(async () => {
      if (this.isOnline && this.syncQueue.length > 0) {
        await this.processPendingOperations();
      }
    }, 30000);

    // Immediate sync on page visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.isOnline) {
        this.processPendingOperations();
      }
    });
  }

  async loadPendingOperations() {
    if (!this.localDB) return;
    
    const transaction = this.localDB.transaction(['sync_queue'], 'readonly');
    const store = transaction.objectStore('sync_queue');
    const request = store.getAll();
    
    return new Promise((resolve) => {
      request.onsuccess = () => {
        this.syncQueue = request.result || [];
        console.log(`📋 Loaded ${this.syncQueue.length} pending operations`);
        resolve();
      };
    });
  }

  // UNFAIR ADVANTAGE: Smart offline operation queuing
  async queueOperation(operation) {
    const operationId = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const queuedOperation = {
      id: operationId,
      ...operation,
      timestamp: Date.now(),
      retry_count: 0,
      priority: operation.priority || 1,
      offline_created: !this.isOnline
    };

    // Add to memory queue
    this.syncQueue.push(queuedOperation);
    
    // Persist to IndexedDB
    await this.saveToLocalDB('sync_queue', queuedOperation);
    
    // Try immediate execution if online
    if (this.isOnline) {
      await this.executeOperation(queuedOperation);
    }
    
    return operationId;
  }

  async executeOperation(operation) {
    try {
      let result = null;
      
      switch (operation.type) {
        case 'contact_create':
        case 'contact_update':
          result = await this.syncContact(operation);
          break;
          
        case 'call_log':
          result = await this.syncCallLog(operation);
          break;
          
        case 'ai_analysis':
          result = await this.syncAIAnalysis(operation);
          break;
          
        case 'whisper_data':
          result = await this.syncWhisperData(operation);
          break;
          
        case 'pipedrive_sync':
          result = await this.syncPipedrive(operation);
          break;
          
        default:
          result = await this.syncGeneric(operation);
      }
      
      if (result.success) {
        // Remove from queue on success
        await this.removeFromQueue(operation.id);
        console.log(`✅ Successfully synced operation: ${operation.type}`);
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error(`❌ Failed to sync operation ${operation.id}:`, error);
      await this.handleOperationFailure(operation, error);
    }
  }

  async syncContact(operation) {
    const response = await fetch('/api/contacts/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: operation.type,
        data: operation.data,
        offline_id: operation.id,
        timestamp: operation.timestamp
      })
    });
    
    return await response.json();
  }

  async syncCallLog(operation) {
    const response = await fetch('/api/calls/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...operation.data,
        offline_created: operation.offline_created
      })
    });
    
    return await response.json();
  }

  async syncAIAnalysis(operation) {
    const response = await fetch('/api/ai/sync-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.data)
    });
    
    return await response.json();
  }

  async syncWhisperData(operation) {
    const formData = new FormData();
    formData.append('audio', operation.data.audioBlob);
    formData.append('metadata', JSON.stringify(operation.data.metadata));
    formData.append('offline_id', operation.id);
    
    const response = await fetch('/api/ai/sync-whisper', {
      method: 'POST',
      body: formData
    });
    
    return await response.json();
  }

  async syncPipedrive(operation) {
    const response = await fetch('/api/pipedrive/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation.data)
    });
    
    return await response.json();
  }

  async syncGeneric(operation) {
    const response = await fetch(operation.endpoint, {
      method: operation.method || 'POST',
      headers: operation.headers || { 'Content-Type': 'application/json' },
      body: operation.body || JSON.stringify(operation.data)
    });
    
    return await response.json();
  }

  async handleOperationFailure(operation, error) {
    operation.retry_count = (operation.retry_count || 0) + 1;
    operation.last_error = error.message;
    operation.last_retry = Date.now();
    
    if (operation.retry_count >= this.maxRetries) {
      console.error(`💀 Operation ${operation.id} failed permanently after ${this.maxRetries} retries`);
      await this.moveToFailedQueue(operation);
      return;
    }
    
    // Exponential backoff retry
    const delay = this.baseDelay * Math.pow(2, operation.retry_count - 1);
    console.log(`🔄 Retrying operation ${operation.id} in ${delay}ms (attempt ${operation.retry_count})`);
    
    setTimeout(async () => {
      if (this.isOnline) {
        await this.executeOperation(operation);
      }
    }, delay);
    
    // Update in storage
    await this.saveToLocalDB('sync_queue', operation);
  }

  async processPendingOperations() {
    if (!this.isOnline || this.syncQueue.length === 0) return;
    
    console.log(`🔄 Processing ${this.syncQueue.length} pending operations...`);
    
    // Sort by priority (higher number = higher priority)
    const sortedOperations = [...this.syncQueue].sort((a, b) => (b.priority || 1) - (a.priority || 1));
    
    // Process operations in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < sortedOperations.length; i += batchSize) {
      const batch = sortedOperations.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(operation => this.executeOperation(operation))
      );
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async removeFromQueue(operationId) {
    this.syncQueue = this.syncQueue.filter(op => op.id !== operationId);
    
    if (this.localDB) {
      const transaction = this.localDB.transaction(['sync_queue'], 'readwrite');
      const store = transaction.objectStore('sync_queue');
      store.delete(operationId);
    }
  }

  async moveToFailedQueue(operation) {
    await this.removeFromQueue(operation.id);
    await this.saveToLocalDB('failed_operations', operation);
  }

  async saveToLocalDB(storeName, data) {
    if (!this.localDB) return;
    
    return new Promise((resolve, reject) => {
      const transaction = this.localDB.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFromLocalDB(storeName, key = null) {
    if (!this.localDB) return null;
    
    return new Promise((resolve, reject) => {
      const transaction = this.localDB.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = key ? store.get(key) : store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // UNFAIR ADVANTAGE: Smart caching for AI responses
  async cacheAIResponse(key, response, ttl = 3600000) { // 1 hour default TTL
    const cacheEntry = {
      key,
      response,
      timestamp: Date.now(),
      ttl,
      expires: Date.now() + ttl
    };
    
    await this.saveToLocalDB('ai_cache', cacheEntry);
  }

  async getCachedAIResponse(key) {
    const cached = await this.getFromLocalDB('ai_cache', key);
    
    if (!cached) return null;
    
    if (Date.now() > cached.expires) {
      // Cache expired, remove it
      const transaction = this.localDB.transaction(['ai_cache'], 'readwrite');
      const store = transaction.objectStore('ai_cache');
      store.delete(key);
      return null;
    }
    
    return cached.response;
  }

  // UNFAIR ADVANTAGE: Offline-capable contact management
  async createContactOffline(contactData) {
    const offlineId = `offline_contact_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Save locally immediately
    const contactWithOfflineId = {
      ...contactData,
      id: offlineId,
      offline_created: true,
      created_at: new Date().toISOString(),
      needs_sync: true
    };
    
    await this.saveToLocalDB('contacts', contactWithOfflineId);
    
    // Queue for sync when online
    await this.queueOperation({
      type: 'contact_create',
      data: contactWithOfflineId,
      priority: 3
    });
    
    return contactWithOfflineId;
  }

  async updateContactOffline(contactId, updates) {
    const existingContact = await this.getFromLocalDB('contacts', contactId);
    
    if (!existingContact) {
      throw new Error('Contact not found');
    }
    
    const updatedContact = {
      ...existingContact,
      ...updates,
      updated_at: new Date().toISOString(),
      needs_sync: true
    };
    
    await this.saveToLocalDB('contacts', updatedContact);
    
    await this.queueOperation({
      type: 'contact_update',
      data: { id: contactId, updates },
      priority: 2
    });
    
    return updatedContact;
  }

  // UNFAIR ADVANTAGE: Offline call logging
  async logCallOffline(callData) {
    const offlineCallId = `offline_call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const callLog = {
      ...callData,
      id: offlineCallId,
      offline_created: true,
      created_at: new Date().toISOString(),
      needs_sync: true
    };
    
    await this.saveToLocalDB('call_logs', callLog);
    
    await this.queueOperation({
      type: 'call_log',
      data: callLog,
      priority: 4 // High priority for call logs
    });
    
    return callLog;
  }

  // UNFAIR ADVANTAGE: Offline AI analysis queuing
  async queueAIAnalysis(analysisData, priority = 1) {
    await this.queueOperation({
      type: 'ai_analysis',
      data: analysisData,
      priority
    });
  }

  // UNFAIR ADVANTAGE: Offline whisper data queuing
  async queueWhisperData(audioBlob, metadata, priority = 2) {
    await this.queueOperation({
      type: 'whisper_data',
      data: { audioBlob, metadata },
      priority
    });
  }

  // Get sync status for UI
  getSyncStatus() {
    return {
      isOnline: this.isOnline,
      pendingOperations: this.syncQueue.length,
      failedOperations: this.retryAttempts.size,
      lastSync: this.lastSyncTime
    };
  }

  // Force sync all pending operations
  async forceSyncAll() {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }
    
    console.log('🚀 Force syncing all pending operations...');
    await this.processPendingOperations();
  }

  // Clear all offline data (use with caution)
  async clearOfflineData() {
    if (this.localDB) {
      const storeNames = ['contacts', 'call_logs', 'ai_cache', 'sync_queue', 'failed_operations'];
      
      for (const storeName of storeNames) {
        const transaction = this.localDB.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        store.clear();
      }
    }
    
    this.syncQueue = [];
    this.retryAttempts.clear();
    
    console.log('🗑️ Offline data cleared');
  }
}

// UNFAIR ADVANTAGE: Export singleton instance
const offlineFirstSystem = new OfflineFirstSystem();

export default offlineFirstSystem;