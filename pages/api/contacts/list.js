// API endpoint to list all contacts
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get contacts from global storage (in production, fetch from database)
    const contacts = global.contacts || [];
    
    // Get call logs to merge with contact data
    const callLogs = global.callLogs || [];
    
    // Enhance contacts with call history
    const enhancedContacts = contacts.map(contact => {
      // Find all calls for this contact
      const contactCalls = callLogs.filter(log => 
        log.phoneNumber === contact.phone || 
        log.to === contact.phone || 
        log.from === contact.phone
      );
      
      // Get the most recent call
      const lastCall = contactCalls.length > 0 ? 
        contactCalls.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))[0] : null;
      
      return {
        ...contact,
        totalCalls: contactCalls.length,
        lastCallDate: lastCall?.timestamp,
        lastCallDuration: lastCall?.duration,
        lastCallSummary: lastCall?.summary
      };
    });
    
    return res.status(200).json({
      success: true,
      contacts: enhancedContacts,
      total: enhancedContacts.length
    });
    
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return res.status(500).json({
      error: 'Failed to fetch contacts',
      message: error.message
    });
  }
}