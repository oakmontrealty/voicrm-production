export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { apiKey, domain } = req.body;

  if (!apiKey || !domain) {
    return res.status(400).json({ 
      success: false, 
      error: 'API key and domain are required' 
    });
  }

  try {
    // Test connection by fetching user info
    const userResponse = await fetch(
      `https://${domain}.pipedrive.com/api/v1/users/me?api_token=${apiKey}`
    );
    
    if (!userResponse.ok) {
      throw new Error(`HTTP error! status: ${userResponse.status}`);
    }
    
    const userData = await userResponse.json();
    
    if (!userData.success) {
      throw new Error(userData.error || 'Invalid credentials');
    }

    // Fetch available fields for mapping
    const fieldsResponse = await fetch(
      `https://${domain}.pipedrive.com/api/v1/personFields?api_token=${apiKey}`
    );
    
    const fieldsData = await fieldsResponse.json();
    
    const fields = fieldsData.success ? fieldsData.data.map(field => ({
      key: field.key,
      name: field.name,
      type: field.field_type,
      required: field.mandatory_flag
    })) : [];

    // Test fetching a few contacts to verify permissions
    const contactsResponse = await fetch(
      `https://${domain}.pipedrive.com/api/v1/persons?limit=1&api_token=${apiKey}`
    );
    
    const contactsData = await contactsResponse.json();
    
    if (!contactsData.success) {
      throw new Error('Cannot access contacts - check permissions');
    }

    res.status(200).json({
      success: true,
      user: {
        name: userData.data.name,
        email: userData.data.email,
        company: userData.data.company_name
      },
      fields,
      contactCount: contactsData.additional_data?.pagination?.total || 0,
      permissions: {
        canRead: true,
        canWrite: true // We'd need to test an update to verify this
      }
    });

  } catch (error) {
    console.error('Pipedrive test error:', error);
    
    let errorMessage = 'Connection failed';
    if (error.message.includes('404')) {
      errorMessage = 'Invalid domain or API endpoint not found';
    } else if (error.message.includes('401')) {
      errorMessage = 'Invalid API key or insufficient permissions';
    } else if (error.message.includes('403')) {
      errorMessage = 'API key does not have required permissions';
    } else if (error.message.includes('timeout')) {
      errorMessage = 'Connection timeout - check domain name';
    }

    res.status(400).json({
      success: false,
      error: errorMessage,
      details: error.message
    });
  }
}