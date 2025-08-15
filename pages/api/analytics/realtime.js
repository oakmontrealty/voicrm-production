// Server-Sent Events for real-time analytics updates
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Set headers for Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);

  // Function to send updates
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Simulate real-time updates
  const interval = setInterval(() => {
    // Generate random updates
    const updateTypes = ['call', 'contact', 'deal', 'activity', 'metric'];
    const updateType = updateTypes[Math.floor(Math.random() * updateTypes.length)];
    
    let update;
    switch (updateType) {
      case 'call':
        update = {
          type: 'call',
          data: {
            id: `call_${Date.now()}`,
            phone: `+614${Math.floor(Math.random() * 100000000)}`,
            duration: Math.floor(Math.random() * 300) + 30,
            status: Math.random() > 0.3 ? 'completed' : 'missed',
            timestamp: new Date().toISOString()
          },
          message: 'New call activity'
        };
        break;
      
      case 'contact':
        update = {
          type: 'contact',
          data: {
            id: `contact_${Date.now()}`,
            name: generateRandomName(),
            leadScore: Math.floor(Math.random() * 100),
            status: Math.random() > 0.5 ? 'hot' : 'warm',
            timestamp: new Date().toISOString()
          },
          message: 'Contact updated'
        };
        break;
      
      case 'deal':
        update = {
          type: 'deal',
          data: {
            id: `deal_${Date.now()}`,
            value: Math.floor(Math.random() * 500000) + 100000,
            stage: ['proposal', 'negotiation', 'closed'][Math.floor(Math.random() * 3)],
            probability: Math.floor(Math.random() * 100),
            timestamp: new Date().toISOString()
          },
          message: 'Deal progression'
        };
        break;
      
      case 'activity':
        update = {
          type: 'activity',
          data: {
            id: `activity_${Date.now()}`,
            type: ['email', 'meeting', 'callback'][Math.floor(Math.random() * 3)],
            contact: generateRandomName(),
            scheduled: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            timestamp: new Date().toISOString()
          },
          message: 'New activity scheduled'
        };
        break;
      
      case 'metric':
        update = {
          type: 'metric',
          data: {
            callsToday: Math.floor(Math.random() * 50) + 20,
            conversionsToday: Math.floor(Math.random() * 10) + 2,
            revenue: Math.floor(Math.random() * 50000) + 10000,
            activeUsers: Math.floor(Math.random() * 10) + 5,
            timestamp: new Date().toISOString()
          },
          message: 'Metrics updated'
        };
        break;
    }
    
    sendUpdate(update);
  }, 5000); // Send update every 5 seconds

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
}

function generateRandomName() {
  const firstNames = ['John', 'Sarah', 'Michael', 'Emma', 'David', 'Lisa', 'James', 'Jennifer'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
}