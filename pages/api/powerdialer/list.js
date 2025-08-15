// API endpoint to list PowerDialer campaigns
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock campaigns data - in production, fetch from database
    const campaigns = [
      {
        id: 'campaign_1',
        name: 'Gregory Hills Follow-up',
        mode: 'progressive',
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        totalContacts: 150,
        goals: {
          target: 100,
          connects: 30,
          appointments: 5
        },
        statistics: {
          totalDialed: 45,
          connected: 12,
          voicemails: 18,
          noAnswer: 15,
          avgCallDuration: 180,
          conversionRate: 26.7,
          appointments: 2
        }
      },
      {
        id: 'campaign_2',
        name: 'Leppington Prospects',
        mode: 'predictive',
        status: 'paused',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        totalContacts: 200,
        goals: {
          target: 150,
          connects: 45,
          appointments: 8
        },
        statistics: {
          totalDialed: 89,
          connected: 28,
          voicemails: 32,
          noAnswer: 29,
          avgCallDuration: 210,
          conversionRate: 31.5,
          appointments: 4
        }
      },
      {
        id: 'campaign_3',
        name: 'Past Client Check-ins',
        mode: 'preview',
        status: 'completed',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        totalContacts: 80,
        goals: {
          target: 80,
          connects: 25,
          appointments: 3
        },
        statistics: {
          totalDialed: 80,
          connected: 32,
          voicemails: 28,
          noAnswer: 20,
          avgCallDuration: 240,
          conversionRate: 40.0,
          appointments: 5
        }
      }
    ];

    return res.status(200).json({
      success: true,
      campaigns
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch campaigns'
    });
  }
}