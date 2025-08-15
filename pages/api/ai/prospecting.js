// API endpoint for AI Prospecting suggestions
import { getAIProspecting } from '../../../lib/ai-prospecting';

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const aiProspecting = getAIProspecting();

    if (req.method === 'GET') {
      const { agentId } = req.query;
      
      // Get today's prospects for agent
      const prospects = await aiProspecting.generateDailyProspects({
        agentId: agentId || 'default',
        agentName: 'Agent',
        currentContacts: [], // Would fetch from database
        recentActivity: [],
        market: { location: 'Sydney SW' }
      });
      
      return res.status(200).json({
        success: true,
        data: prospects
      });
    }

    // POST requests
    const { action, ...params } = req.body;

    switch (action) {
      case 'generate':
        const prospects = await aiProspecting.generateDailyProspects(params);
        return res.status(200).json({
          success: true,
          data: prospects
        });

      case 'details':
        const details = await aiProspecting.getProspectDetails(params.prospectId);
        return res.status(200).json({
          success: true,
          data: details
        });

      case 'track':
        const tracking = await aiProspecting.trackInteraction(
          params.prospectId,
          params.interaction
        );
        return res.status(200).json({
          success: true,
          data: tracking
        });

      case 'refresh':
        // Regenerate prospects with new parameters
        const refreshed = await aiProspecting.generateDailyProspects({
          ...params,
          refresh: true
        });
        return res.status(200).json({
          success: true,
          data: refreshed
        });

      default:
        return res.status(400).json({
          error: 'Invalid action',
          validActions: ['generate', 'details', 'track', 'refresh']
        });
    }

  } catch (error) {
    console.error('AI Prospecting API error:', error);
    return res.status(500).json({
      error: 'Failed to process prospecting request',
      message: error.message
    });
  }
}