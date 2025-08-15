// PipeDrive Test Endpoint - Check what data is available
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pipedriveApiKey } = req.body;
  
  if (!pipedriveApiKey) {
    return res.status(400).json({ error: 'API key required' });
  }

  try {
    console.log('Testing PipeDrive API with key:', pipedriveApiKey.substring(0, 10) + '...');
    
    // Test multiple endpoints to see what data exists
    const tests = await Promise.allSettled([
      // Test persons endpoint
      axios.get('https://api.pipedrive.com/v1/persons', {
        params: { api_token: pipedriveApiKey, limit: 1 }
      }),
      
      // Test deals endpoint
      axios.get('https://api.pipedrive.com/v1/deals', {
        params: { api_token: pipedriveApiKey, limit: 1 }
      }),
      
      // Test activities endpoint
      axios.get('https://api.pipedrive.com/v1/activities', {
        params: { api_token: pipedriveApiKey, limit: 1 }
      }),
      
      // Test organizations endpoint
      axios.get('https://api.pipedrive.com/v1/organizations', {
        params: { api_token: pipedriveApiKey, limit: 1 }
      }),
      
      // Test notes endpoint
      axios.get('https://api.pipedrive.com/v1/notes', {
        params: { api_token: pipedriveApiKey, limit: 1 }
      }),
      
      // Test user info
      axios.get('https://api.pipedrive.com/v1/users/me', {
        params: { api_token: pipedriveApiKey }
      })
    ]);

    const results = {
      persons: { 
        status: tests[0].status,
        count: tests[0].status === 'fulfilled' ? 
          (tests[0].value.data.additional_data?.pagination?.total || 0) : 0,
        error: tests[0].reason?.message
      },
      deals: { 
        status: tests[1].status,
        count: tests[1].status === 'fulfilled' ? 
          (tests[1].value.data.additional_data?.pagination?.total || 0) : 0,
        error: tests[1].reason?.message
      },
      activities: { 
        status: tests[2].status,
        count: tests[2].status === 'fulfilled' ? 
          (tests[2].value.data.additional_data?.pagination?.total || 0) : 0,
        error: tests[2].reason?.message
      },
      organizations: { 
        status: tests[3].status,
        count: tests[3].status === 'fulfilled' ? 
          (tests[3].value.data.additional_data?.pagination?.total || 0) : 0,
        error: tests[3].reason?.message
      },
      notes: { 
        status: tests[4].status,
        count: tests[4].status === 'fulfilled' ? 
          (tests[4].value.data.additional_data?.pagination?.total || 0) : 0,
        error: tests[4].reason?.message
      },
      user: tests[5].status === 'fulfilled' ? {
        name: tests[5].value.data.data.name,
        email: tests[5].value.data.data.email,
        company: tests[5].value.data.data.company_name
      } : null
    };

    // Check if API key is valid
    const validKey = tests.some(t => t.status === 'fulfilled');
    
    if (!validKey) {
      return res.status(401).json({ 
        error: 'Invalid API key',
        details: 'Could not authenticate with PipeDrive API'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'PipeDrive API test complete',
      data: results,
      summary: {
        totalContacts: results.persons.count,
        totalDeals: results.deals.count,
        totalActivities: results.activities.count,
        totalOrganizations: results.organizations.count,
        totalNotes: results.notes.count,
        hasData: Object.values(results).some(r => r.count > 0)
      }
    });

  } catch (error) {
    console.error('Test error:', error);
    return res.status(500).json({ 
      error: 'Test failed',
      message: error.message,
      details: error.response?.data || error
    });
  }
}