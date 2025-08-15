// Save call log with AI summary - includes ALL call attempts
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      phoneNumber, 
      to,
      from,
      duration, 
      direction, 
      status,
      summary,
      recording_url,
      recordingUrl,
      errorMessage,
      callSid,
      attemptNumber,
      device,
      agent,
      notes,
      tags
    } = req.body;

    // Store call log in memory (in production, save to database)
    const callLog = {
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      phoneNumber: phoneNumber || to || from,
      to: to || phoneNumber,
      from: from || 'Browser Client',
      duration: duration || 0,
      direction: direction || 'outbound',
      status: status || 'completed', // completed, failed, busy, no-answer, cancelled, in-progress
      recording_url: recording_url || recordingUrl,
      summary: summary || null,
      errorMessage: errorMessage || null,
      callSid: callSid || null,
      attemptNumber: attemptNumber || 1,
      device: device || 'browser',
      agent: agent || 'System',
      notes: notes || '',
      tags: tags || [],
      created_at: new Date().toISOString()
    };

    // Store in global memory for demo (replace with database in production)
    if (!global.callLogs) {
      global.callLogs = [];
    }
    global.callLogs.unshift(callLog); // Add to beginning of array
    
    // Keep only last 500 calls in memory (increased for better history)
    if (global.callLogs.length > 500) {
      global.callLogs = global.callLogs.slice(0, 500);
    }

    // Update contact's call history if contact exists
    if (global.contacts && (phoneNumber || to)) {
      const contactPhone = phoneNumber || to;
      const contact = global.contacts.find(c => 
        c.phone === contactPhone || 
        c.phone?.includes(contactPhone.replace(/\D/g, '')) ||
        contactPhone.includes(c.phone?.replace(/\D/g, ''))
      );
      
      if (contact) {
        // Update contact's call statistics
        contact.last_call_date = callLog.timestamp;
        contact.last_call_status = callLog.status;
        contact.total_calls = (contact.total_calls || 0) + 1;
        
        // Track failed attempts
        if (status === 'failed' || status === 'no-answer' || status === 'busy') {
          contact.failed_call_attempts = (contact.failed_call_attempts || 0) + 1;
          contact.last_failed_attempt = callLog.timestamp;
        } else if (status === 'completed') {
          contact.successful_calls = (contact.successful_calls || 0) + 1;
          contact.total_talk_time = (contact.total_talk_time || 0) + (duration || 0);
        }
        
        // Add to contact's timeline
        if (!contact.call_history) {
          contact.call_history = [];
        }
        contact.call_history.unshift({
          id: callLog.id,
          timestamp: callLog.timestamp,
          duration: callLog.duration,
          status: callLog.status,
          direction: callLog.direction,
          hasSummary: !!callLog.summary
        });
        
        // Keep only last 50 calls per contact
        if (contact.call_history.length > 50) {
          contact.call_history = contact.call_history.slice(0, 50);
        }
      }
    }

    console.log(`Call log saved: ${callLog.id} - Status: ${callLog.status}`);

    return res.status(200).json({
      success: true,
      callLog,
      totalLogs: global.callLogs.length
    });
  } catch (error) {
    console.error('Error saving call log:', error);
    return res.status(500).json({
      error: 'Failed to save call log',
      message: error.message
    });
  }
}