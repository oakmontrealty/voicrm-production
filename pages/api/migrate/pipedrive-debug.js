// PipeDrive Debug - Find the correct domain and test data access
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
    console.log('Debugging PipeDrive API access...');
    
    // First, get the company domain
    const userResponse = await axios.get('https://api.pipedrive.com/v1/users/me', {
      params: { api_token: pipedriveApiKey }
    });
    
    const companyDomain = userResponse.data.data.company_domain;
    const companyId = userResponse.data.data.company_id;
    
    console.log('Company domain:', companyDomain);
    console.log('Company ID:', companyId);
    
    // Try different API approaches
    const tests = await Promise.allSettled([
      // Try with company domain
      axios.get(`https://${companyDomain}.pipedrive.com/v1/persons`, {
        params: { api_token: pipedriveApiKey, limit: 10, start: 0 }
      }).catch(e => ({ error: 'Domain-based API failed', message: e.message })),
      
      // Try standard API with different parameters
      axios.get('https://api.pipedrive.com/v1/persons', {
        params: { 
          api_token: pipedriveApiKey, 
          limit: 10,
          start: 0,
          sort: 'add_time DESC'
        }
      }),
      
      // Try to get persons count directly
      axios.get('https://api.pipedrive.com/v1/persons', {
        params: { 
          api_token: pipedriveApiKey, 
          limit: 0  // Just get count
        }
      }),
      
      // Try recents endpoint
      axios.get('https://api.pipedrive.com/v1/recents', {
        params: { 
          api_token: pipedriveApiKey,
          since_timestamp: '2020-01-01 00:00:00',
          limit: 10
        }
      }),
      
      // Get deals to see if those work
      axios.get('https://api.pipedrive.com/v1/deals', {
        params: { api_token: pipedriveApiKey, limit: 10 }
      }),
      
      // Get persons with all fields
      axios.get('https://api.pipedrive.com/v1/persons', {
        params: { 
          api_token: pipedriveApiKey, 
          limit: 1,
          get_summary: 1
        }
      }),
      
      // Check person fields to see structure
      axios.get('https://api.pipedrive.com/v1/personFields', {
        params: { api_token: pipedriveApiKey }
      })
    ]);

    // Process results
    const results = {
      companyInfo: {
        domain: companyDomain,
        id: companyId,
        user: userResponse.data.data.name,
        email: userResponse.data.data.email
      },
      tests: []
    };

    // Check domain-based API
    if (tests[0].status === 'fulfilled' && !tests[0].value.error) {
      const data = tests[0].value.data;
      results.tests.push({
        endpoint: 'Domain-based persons',
        success: data.success,
        count: data.data?.length || 0,
        total: data.additional_data?.pagination?.total || 0,
        hasMore: data.additional_data?.pagination?.more_items_in_collection || false
      });
    } else {
      results.tests.push({
        endpoint: 'Domain-based persons',
        success: false,
        error: tests[0].value?.error || tests[0].reason?.message
      });
    }

    // Check standard persons API
    if (tests[1].status === 'fulfilled') {
      const data = tests[1].value.data;
      results.tests.push({
        endpoint: 'Standard persons API',
        success: data.success,
        returned: data.data?.length || 0,
        total: data.additional_data?.pagination?.total || 0,
        hasMore: data.additional_data?.pagination?.more_items_in_collection || false,
        firstPerson: data.data?.[0] ? {
          id: data.data[0].id,
          name: data.data[0].name,
          add_time: data.data[0].add_time
        } : null
      });
    }

    // Check persons count
    if (tests[2].status === 'fulfilled') {
      const data = tests[2].value.data;
      results.tests.push({
        endpoint: 'Persons count check',
        success: data.success,
        total: data.additional_data?.pagination?.total || 0
      });
    }

    // Check recents
    if (tests[3].status === 'fulfilled') {
      const data = tests[3].value.data;
      results.tests.push({
        endpoint: 'Recents API',
        success: data.success,
        count: data.data?.length || 0
      });
    }

    // Check deals
    if (tests[4].status === 'fulfilled') {
      const data = tests[4].value.data;
      results.tests.push({
        endpoint: 'Deals API',
        success: data.success,
        count: data.data?.length || 0,
        total: data.additional_data?.pagination?.total || 0
      });
    }

    // Check persons with summary
    if (tests[5].status === 'fulfilled') {
      const data = tests[5].value.data;
      results.tests.push({
        endpoint: 'Persons with summary',
        success: data.success,
        summary: data.additional_data?.summary || {},
        total: data.additional_data?.pagination?.total || 0
      });
    }

    // Check person fields
    if (tests[6].status === 'fulfilled') {
      const data = tests[6].value.data;
      results.tests.push({
        endpoint: 'Person fields',
        success: data.success,
        fieldsCount: data.data?.length || 0,
        customFields: data.data?.filter(f => !f.is_subfield && f.edit_flag).length || 0
      });
    }

    // Try alternative approach - search
    try {
      const searchResponse = await axios.get('https://api.pipedrive.com/v1/persons/search', {
        params: { 
          api_token: pipedriveApiKey,
          term: '',  // Empty search to get all
          limit: 10
        }
      });
      
      results.searchAPI = {
        success: searchResponse.data.success,
        count: searchResponse.data.data?.items?.length || 0,
        total: searchResponse.data.additional_data?.pagination?.total || 0
      };
    } catch (searchError) {
      results.searchAPI = {
        success: false,
        error: searchError.message
      };
    }

    // Try filters to see if data is filtered
    try {
      const filtersResponse = await axios.get('https://api.pipedrive.com/v1/filters', {
        params: { 
          api_token: pipedriveApiKey,
          type: 'people'
        }
      });
      
      results.filters = {
        success: filtersResponse.data.success,
        count: filtersResponse.data.data?.length || 0,
        activeFilters: filtersResponse.data.data?.filter(f => f.active_flag).map(f => ({
          name: f.name,
          id: f.id
        })) || []
      };
    } catch (filterError) {
      results.filters = {
        success: false,
        error: filterError.message
      };
    }

    return res.status(200).json({
      success: true,
      message: 'Debug complete - check results for data access',
      ...results
    });

  } catch (error) {
    console.error('Debug error:', error);
    return res.status(500).json({ 
      error: 'Debug failed',
      message: error.message,
      details: error.response?.data || error
    });
  }
}