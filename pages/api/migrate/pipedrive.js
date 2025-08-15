// PipeDrive Migration API Endpoint
import { getPipeDriveMigration } from '../../../lib/pipedrive-migration';

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      pipedriveApiKey,
      action = 'migrate', // 'migrate', 'status', 'test'
      options = {}
    } = req.body;

    // Validate API key
    if (!pipedriveApiKey && action !== 'status') {
      return res.status(400).json({ 
        error: 'PipeDrive API key is required',
        help: 'Get your API key from PipeDrive Settings > Personal > API'
      });
    }

    const migration = getPipeDriveMigration();

    // Handle different actions
    switch (action) {
      case 'test':
        // Test connection to PipeDrive
        await migration.initialize(
          pipedriveApiKey,
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Try to fetch one contact to test
        const testResponse = await fetch(`https://api.pipedrive.com/v1/persons?api_token=${pipedriveApiKey}&limit=1`);
        const testData = await testResponse.json();
        
        if (testData.success) {
          return res.status(200).json({
            success: true,
            message: 'PipeDrive connection successful!',
            accountInfo: {
              companyName: testData.additional_data?.company?.name,
              totalContacts: testData.additional_data?.pagination?.total || 0
            }
          });
        } else {
          throw new Error('Invalid PipeDrive API key');
        }

      case 'migrate':
        // Initialize migration
        await migration.initialize(
          pipedriveApiKey,
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        
        // Start migration with options
        const report = await migration.startMigration({
          includeContacts: options.contacts !== false,
          includeDeals: options.deals !== false,
          includeActivities: options.activities !== false,
          includeNotes: options.notes !== false,
          includeOrganizations: options.organizations !== false,
          includeCustomFields: options.customFields !== false
        });
        
        return res.status(200).json({
          success: true,
          message: 'Migration completed successfully!',
          report
        });

      case 'status':
        // Check migration status
        const status = await migration.checkMigrationStatus();
        
        return res.status(200).json({
          success: true,
          status
        });

      default:
        return res.status(400).json({ 
          error: 'Invalid action',
          validActions: ['test', 'migrate', 'status']
        });
    }
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ 
      error: 'Migration failed',
      message: error.message,
      details: error.response?.data || error
    });
  }
}

// Increase timeout for migration endpoint
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
    responseLimit: false,
    externalResolver: true,
  },
};