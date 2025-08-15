// PipeDrive Webhook Handler
// Receives real-time updates from PipeDrive

import { getPipeDriveSync } from '../../../lib/pipedrive-realtime-sync';

export default async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify webhook authenticity (optional - add your verification logic)
    const signature = req.headers['x-pipedrive-signature'];
    
    // Parse webhook data
    const {
      event,      // e.g., 'added.person', 'updated.deal', etc.
      current,    // Current state of the object
      previous,   // Previous state (for updates)
      meta        // Metadata about the event
    } = req.body;

    console.log(`📨 Webhook received: ${event}`);

    // Initialize sync handler
    const sync = getPipeDriveSync();
    
    // Process the webhook
    await sync.handleWebhook(event, current);

    // Send success response
    res.status(200).json({ 
      success: true, 
      message: 'Webhook processed',
      event 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ 
      error: 'Failed to process webhook',
      message: error.message 
    });
  }
}

// Increase body size limit for webhook payloads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};