// API endpoint to complete/stop a PowerDialer campaign
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ 
        success: false,
        error: 'Campaign ID is required' 
      });
    }

    // In production:
    // 1. Update campaign status in database
    // 2. Stop Twilio dialing queue
    // 3. Generate final report
    // 4. Disconnect agent device

    return res.status(200).json({
      success: true,
      message: 'Campaign completed successfully',
      campaignId,
      status: 'completed',
      completedAt: new Date().toISOString(),
      finalStats: {
        totalDialed: 80,
        connected: 32,
        voicemails: 28,
        appointments: 5
      }
    });
  } catch (error) {
    console.error('Error completing campaign:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to complete campaign'
    });
  }
}