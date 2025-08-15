import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function PipedriveSync() {
  const [apiKey, setApiKey] = useState('');
  const [domain, setDomain] = useState('');
  const [syncStatus, setSyncStatus] = useState('idle');
  const [lastSync, setLastSync] = useState(null);
  const [syncProgress, setSyncProgress] = useState(0);
  const [contacts, setContacts] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [pipedriveFields, setPipedriveFields] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    synced: 0,
    errors: 0,
    duplicates: 0
  });

  const supabase = createClientComponentClient();
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    loadSyncSettings();
    loadLastSync();
    setupAutoSync();
    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, []);

  const loadSyncSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'pipedrive_config')
        .single();
      
      if (data?.value) {
        const config = JSON.parse(data.value);
        setApiKey(config.apiKey || '');
        setDomain(config.domain || '');
        setFieldMapping(config.fieldMapping || {});
      }
    } catch (error) {
      console.error('Error loading sync settings:', error);
    }
  };

  const loadLastSync = async () => {
    try {
      const { data } = await supabase
        .from('sync_history')
        .select('*')
        .eq('service', 'pipedrive')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      
      if (data) {
        setLastSync(new Date(data.created_at));
        setStats(data.stats || stats);
      }
    } catch (error) {
      console.log('No previous sync found');
    }
  };

  const setupAutoSync = () => {
    syncIntervalRef.current = setInterval(async () => {
      if (apiKey && domain && syncStatus === 'idle') {
        await performSync(false);
      }
    }, 30 * 60 * 1000); // Every 30 minutes
  };

  const saveSyncSettings = async () => {
    try {
      const config = {
        apiKey,
        domain,
        fieldMapping
      };

      await supabase
        .from('settings')
        .upsert({
          key: 'pipedrive_config',
          value: JSON.stringify(config)
        });

      // Test connection
      await testPipedriveConnection();
    } catch (error) {
      console.error('Error saving sync settings:', error);
    }
  };

  const testPipedriveConnection = async () => {
    setSyncStatus('testing');
    try {
      const response = await fetch(`/api/pipedrive/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, domain })
      });

      const result = await response.json();
      if (result.success) {
        setPipedriveFields(result.fields);
        setSyncStatus('connected');
      } else {
        setSyncStatus('error');
        throw new Error(result.error);
      }
    } catch (error) {
      setSyncStatus('error');
      console.error('Connection test failed:', error);
    }
  };

  const performSync = async (fullSync = true) => {
    if (!apiKey || !domain) return;
    
    setSyncStatus('syncing');
    setSyncProgress(0);
    setConflicts([]);

    try {
      // Get contacts from Pipedrive
      const pipedriveContacts = await fetchPipedriveContacts(fullSync);
      setSyncProgress(25);

      // Map fields and detect conflicts
      const mappedContacts = await mapContactFields(pipedriveContacts);
      setSyncProgress(50);

      // Resolve conflicts and sync to database
      const syncResults = await syncToDatabase(mappedContacts);
      setSyncProgress(75);

      // Update sync history
      await updateSyncHistory(syncResults);
      setSyncProgress(100);

      setSyncStatus('completed');
      setLastSync(new Date());
      setStats(syncResults.stats);

      setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  };

  const fetchPipedriveContacts = async (fullSync) => {
    const params = new URLSearchParams({
      api_key: apiKey,
      limit: 500,
      sort: 'update_time DESC'
    });

    if (!fullSync && lastSync) {
      params.append('since', lastSync.toISOString());
    }

    const response = await fetch(`https://${domain}.pipedrive.com/api/v1/persons?${params}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch contacts');
    }

    return result.data || [];
  };

  const mapContactFields = async (pipedriveContacts) => {
    const mapped = [];
    const detectedConflicts = [];

    for (const contact of pipedriveContacts) {
      const mappedContact = {
        pipedrive_id: contact.id,
        name: contact.name,
        email: getFieldValue(contact, 'email'),
        phone: getFieldValue(contact, 'phone'),
        company: getFieldValue(contact, 'company'),
        title: getFieldValue(contact, 'title'),
        address: getFieldValue(contact, 'address'),
        notes: getFieldValue(contact, 'notes'),
        tags: getFieldValue(contact, 'tags'),
        custom_fields: extractCustomFields(contact),
        last_activity: contact.last_activity_date,
        pipedrive_updated: contact.update_time,
        raw_data: contact
      };

      // Check for existing contact conflicts
      const existingContact = await findExistingContact(mappedContact);
      if (existingContact) {
        detectedConflicts.push({
          pipedrive: mappedContact,
          existing: existingContact,
          conflicts: findConflicts(mappedContact, existingContact)
        });
      }

      mapped.push(mappedContact);
    }

    setConflicts(detectedConflicts);
    return mapped;
  };

  const getFieldValue = (contact, fieldName) => {
    const mapping = fieldMapping[fieldName];
    if (mapping) {
      return contact[mapping] || contact.custom_fields?.[mapping];
    }
    
    // Default mappings
    const defaults = {
      email: contact.email?.[0]?.value || contact.email,
      phone: contact.phone?.[0]?.value || contact.phone,
      company: contact.company_id?.name || contact.org_name,
      title: contact.job_title,
      address: contact.address,
      notes: contact.notes,
      tags: contact.visible_to === 'SHARED' ? ['shared'] : ['private']
    };

    return defaults[fieldName];
  };

  const extractCustomFields = (contact) => {
    const customFields = {};
    if (contact.custom_fields) {
      Object.entries(contact.custom_fields).forEach(([key, value]) => {
        if (value !== null && value !== '') {
          customFields[key] = value;
        }
      });
    }
    return customFields;
  };

  const findExistingContact = async (contact) => {
    const { data } = await supabase
      .from('contacts')
      .select('*')
      .or(`email.eq.${contact.email},phone.eq.${contact.phone},pipedrive_id.eq.${contact.pipedrive_id}`)
      .limit(1)
      .single();

    return data;
  };

  const findConflicts = (pipedriveContact, existingContact) => {
    const conflicts = [];
    const fields = ['name', 'email', 'phone', 'company', 'title', 'address'];

    fields.forEach(field => {
      const pipedriveValue = pipedriveContact[field];
      const existingValue = existingContact[field];
      
      if (pipedriveValue && existingValue && pipedriveValue !== existingValue) {
        conflicts.push({
          field,
          pipedrive: pipedriveValue,
          existing: existingValue
        });
      }
    });

    return conflicts;
  };

  const syncToDatabase = async (contacts) => {
    const results = {
      stats: { total: contacts.length, synced: 0, errors: 0, duplicates: 0 }
    };

    for (const contact of contacts) {
      try {
        const { data, error } = await supabase
          .from('contacts')
          .upsert(contact, { 
            onConflict: 'pipedrive_id',
            ignoreDuplicates: false 
          });

        if (error) {
          results.stats.errors++;
          console.error('Error syncing contact:', error);
        } else {
          results.stats.synced++;
        }
      } catch (error) {
        results.stats.errors++;
        console.error('Error syncing contact:', error);
      }
    }

    return results;
  };

  const updateSyncHistory = async (results) => {
    await supabase
      .from('sync_history')
      .insert({
        service: 'pipedrive',
        stats: results.stats,
        conflicts: conflicts.length,
        created_at: new Date().toISOString()
      });
  };

  const resolveConflict = async (conflictIndex, resolution) => {
    const conflict = conflicts[conflictIndex];
    const resolvedContact = { ...conflict.pipedrive };

    resolution.forEach(({ field, source }) => {
      if (source === 'existing') {
        resolvedContact[field] = conflict.existing[field];
      }
    });

    await supabase
      .from('contacts')
      .upsert(resolvedContact, { onConflict: 'pipedrive_id' });

    setConflicts(prev => prev.filter((_, index) => index !== conflictIndex));
  };

  const FieldMappingModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Field Mapping</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium mb-2">VoiCRM Fields</h4>
            {['name', 'email', 'phone', 'company', 'title', 'address', 'notes'].map(field => (
              <div key={field} className="mb-2">
                <label className="block text-sm font-medium">{field}</label>
                <select 
                  value={fieldMapping[field] || ''}
                  onChange={(e) => setFieldMapping(prev => ({ ...prev, [field]: e.target.value }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Select Pipedrive Field</option>
                  {pipedriveFields.map(pField => (
                    <option key={pField.key} value={pField.key}>
                      {pField.name}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Preview</h4>
            <div className="bg-gray-50 p-4 rounded">
              <pre className="text-xs">{JSON.stringify(fieldMapping, null, 2)}</pre>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <button
            onClick={() => setShowFieldMapping(false)}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              saveSyncSettings();
              setShowFieldMapping(false);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Save Mapping
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 bg-white rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Pipedrive Integration</h2>
        <div className="flex space-x-2">
          <span className={`px-3 py-1 rounded-full text-sm ${
            syncStatus === 'idle' ? 'bg-gray-100 text-gray-700' :
            syncStatus === 'connected' ? 'bg-green-100 text-green-700' :
            syncStatus === 'syncing' ? 'bg-blue-100 text-blue-700' :
            syncStatus === 'completed' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {syncStatus === 'idle' && 'Ready'}
            {syncStatus === 'testing' && 'Testing...'}
            {syncStatus === 'connected' && 'Connected'}
            {syncStatus === 'syncing' && 'Syncing...'}
            {syncStatus === 'completed' && 'Completed'}
            {syncStatus === 'error' && 'Error'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Pipedrive Domain</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="your-company"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Enter your Pipedrive domain (e.g., "your-company" for your-company.pipedrive.com)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Your Pipedrive API Key"
              className="w-full p-3 border border-gray-300 rounded-lg"
            />
            <p className="text-sm text-gray-500 mt-1">
              Found in Settings → Personal Preferences → API
            </p>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={testPipedriveConnection}
              disabled={!apiKey || !domain}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              Test Connection
            </button>
            <button
              onClick={() => setShowFieldMapping(true)}
              disabled={syncStatus !== 'connected'}
              className="flex-1 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 disabled:opacity-50"
            >
              Field Mapping
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium mb-3">Sync Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Total Contacts</div>
                <div className="font-semibold text-lg">{stats.total}</div>
              </div>
              <div>
                <div className="text-gray-500">Successfully Synced</div>
                <div className="font-semibold text-lg text-green-600">{stats.synced}</div>
              </div>
              <div>
                <div className="text-gray-500">Errors</div>
                <div className="font-semibold text-lg text-red-600">{stats.errors}</div>
              </div>
              <div>
                <div className="text-gray-500">Duplicates</div>
                <div className="font-semibold text-lg text-yellow-600">{stats.duplicates}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Last Sync</span>
              <span className="text-sm text-gray-500">
                {lastSync ? lastSync.toLocaleString() : 'Never'}
              </span>
            </div>
            
            {syncStatus === 'syncing' && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => performSync(false)}
              disabled={syncStatus !== 'connected' && syncStatus !== 'idle'}
              className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50"
            >
              Quick Sync
            </button>
            <button
              onClick={() => performSync(true)}
              disabled={syncStatus !== 'connected' && syncStatus !== 'idle'}
              className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50"
            >
              Full Sync
            </button>
          </div>
        </div>
      </div>

      {conflicts.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Resolve Conflicts ({conflicts.length})</h3>
          <div className="space-y-4">
            {conflicts.slice(0, 5).map((conflict, index) => (
              <div key={index} className="border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">{conflict.pipedrive.name}</h4>
                  <button
                    onClick={() => resolveConflict(index, conflict.conflicts.map(c => ({ field: c.field, source: 'pipedrive' })))}
                    className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Use Pipedrive Data
                  </button>
                </div>
                
                <div className="space-y-2 text-sm">
                  {conflict.conflicts.map((c, cIndex) => (
                    <div key={cIndex} className="grid grid-cols-3 gap-2">
                      <div className="font-medium">{c.field}</div>
                      <div className="text-blue-600">{c.pipedrive}</div>
                      <div className="text-gray-600">{c.existing}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Field Mapping Modal would go here */}
    </div>
  );
}