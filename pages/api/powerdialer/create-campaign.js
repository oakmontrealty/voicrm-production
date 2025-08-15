// API endpoint to create a PowerDialer campaign
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      name, 
      mode, 
      targetCalls, 
      targetConnects, 
      targetAppointments,
      startTime,
      endTime,
      filters,
      contacts,
      agentId
    } = req.body;

    if (!name || !mode) {
      return res.status(400).json({ 
        success: false,
        error: 'Campaign name and mode are required' 
      });
    }

    // Create campaign object
    const campaign = {
      id: `campaign_${Date.now()}`,
      name,
      mode,
      status: 'created',
      agentId,
      createdAt: new Date().toISOString(),
      totalContacts: contacts?.length || 0,
      goals: {
        target: targetCalls,
        connects: targetConnects,
        appointments: targetAppointments
      },
      schedule: {
        startTime,
        endTime
      },
      filters,
      statistics: {
        totalDialed: 0,
        connected: 0,
        voicemails: 0,
        noAnswer: 0,
        avgCallDuration: 0,
        conversionRate: 0,
        appointments: 0
      }
    };

    // In production, save to database
    // await supabase.from('powerdialer_campaigns').insert([campaign]);

    return res.status(200).json({
      success: true,
      campaign,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create campaign'
    });
  }
}