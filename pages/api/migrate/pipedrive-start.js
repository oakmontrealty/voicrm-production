// Start PipeDrive Migration as Background Job
import { getPipeDriveMigration } from '../../../lib/pipedrive-migration';

// Store migration status in memory (in production, use Redis or database)
global.migrationJobs = global.migrationJobs || {};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const { action = 'status', jobId } = req.query;
    
    if (action === 'status' && jobId) {
      const job = global.migrationJobs?.[jobId];
      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }
      return res.status(200).json({ success: true, job });
    }
    
    if (action === 'list') {
      return res.status(200).json({
        success: true,
        jobs: Object.values(global.migrationJobs || {})
      });
    }
    
    return res.status(400).json({ error: 'Invalid action' });
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { 
    pipedriveApiKey = '03648df313fd7b592cca520407a20f3bd749afa9',
    action = 'start'
  } = req.body;

  const jobId = `migration_${Date.now()}`;

  if (action === 'start') {
    // Start migration in background
    global.migrationJobs[jobId] = {
      id: jobId,
      status: 'running',
      startTime: new Date(),
      progress: {
        contacts: { total: 0, processed: 0, migrated: 0, failed: 0 },
        deals: { total: 0, processed: 0, migrated: 0, failed: 0 },
        activities: { total: 0, processed: 0, migrated: 0, failed: 0 },
        notes: { total: 0, processed: 0, migrated: 0, failed: 0 }
      }
    };

    // Start migration asynchronously
    startMigrationAsync(jobId, pipedriveApiKey);

    return res.status(200).json({
      success: true,
      message: 'Migration started in background',
      jobId,
      checkStatusUrl: `/api/migrate/pipedrive-start?action=status&jobId=${jobId}`
    });
  }

  if (action === 'status') {
    const { jobId } = req.query;
    const job = global.migrationJobs[jobId];

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({
      success: true,
      job
    });
  }

  if (action === 'list') {
    return res.status(200).json({
      success: true,
      jobs: Object.values(global.migrationJobs || {})
    });
  }

  return res.status(400).json({ error: 'Invalid action' });
}

async function startMigrationAsync(jobId, apiKey) {
  const job = global.migrationJobs[jobId];
  
  try {
    console.log(`🚀 Starting migration job ${jobId}`);
    
    const migration = getPipeDriveMigration();
    
    // Initialize with progress callback
    await migration.initialize(
      apiKey,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    // Set progress callback
    migration.onProgress = (stats) => {
      if (job) {
        job.progress = stats;
        job.lastUpdate = new Date();
      }
    };

    // Start migration with all data types
    const report = await migration.startMigration({
      includeContacts: true,
      includeDeals: true,
      includeActivities: true,
      includeNotes: true,
      includeOrganizations: true,
      includeCustomFields: true
    });

    // Update job status
    job.status = 'completed';
    job.endTime = new Date();
    job.report = report;
    job.duration = (job.endTime - job.startTime) / 1000;

    console.log(`✅ Migration job ${jobId} completed successfully`);
    console.log(`Duration: ${job.duration} seconds`);
    console.log(`Stats:`, report.stats);

  } catch (error) {
    console.error(`❌ Migration job ${jobId} failed:`, error);
    
    job.status = 'failed';
    job.endTime = new Date();
    job.error = error.message;
    job.duration = (job.endTime - job.startTime) / 1000;
  }
}