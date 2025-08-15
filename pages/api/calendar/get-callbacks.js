// Get scheduled callbacks from call summaries
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get callbacks from global storage (in production, query database)
    const callbacks = global.scheduledCallbacks || [];
    
    return res.status(200).json({
      success: true,
      callbacks: callbacks
    });
  } catch (error) {
    console.error('Error fetching callbacks:', error);
    return res.status(500).json({
      error: 'Failed to fetch callbacks',
      message: error.message
    });
  }
}