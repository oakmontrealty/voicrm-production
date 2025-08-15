// PowerDialer API endpoints
import { getPowerDialer } from '../../../lib/power-dialer';

export default async function handler(req, res) {
  const { action } = req.query;
  const powerDialer = getPowerDialer();

  try {
    switch (action) {
      case 'create-campaign':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const campaign = powerDialer.createCampaign(req.body);
        return res.status(200).json({
          success: true,
          campaign
        });

      case 'start':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const { campaignId, agentDevice } = req.body;
        await powerDialer.startCampaign(campaignId, agentDevice);
        
        return res.status(200).json({
          success: true,
          message: 'Campaign started',
          campaignId
        });

      case 'pause':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const paused = powerDialer.pauseCampaign(req.body.campaignId);
        return res.status(200).json({
          success: paused,
          message: paused ? 'Campaign paused' : 'Campaign not found or not active'
        });

      case 'resume':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const resumed = powerDialer.resumeCampaign(req.body.campaignId);
        return res.status(200).json({
          success: resumed,
          message: resumed ? 'Campaign resumed' : 'Campaign not found or not paused'
        });

      case 'status':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const { campaignId: id } = req.query;
        const statusCampaign = powerDialer.activeCampaigns.get(id);
        
        if (!statusCampaign) {
          return res.status(404).json({ error: 'Campaign not found' });
        }
        
        return res.status(200).json({
          success: true,
          campaign: {
            id: statusCampaign.id,
            name: statusCampaign.name,
            status: statusCampaign.status,
            statistics: statusCampaign.statistics,
            goals: statusCampaign.goals,
            queueSize: powerDialer.callQueue.filter(q => q.campaignId === id).length
          }
        });

      case 'complete':
        if (req.method !== 'POST') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const report = powerDialer.completeCampaign(req.body.campaignId);
        return res.status(200).json({
          success: true,
          report
        });

      case 'list':
        if (req.method !== 'GET') {
          return res.status(405).json({ error: 'Method not allowed' });
        }
        
        const campaigns = Array.from(powerDialer.activeCampaigns.values()).map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          mode: c.mode,
          totalContacts: c.contacts.length,
          statistics: c.statistics
        }));
        
        return res.status(200).json({
          success: true,
          campaigns
        });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('PowerDialer API error:', error);
    return res.status(500).json({
      error: 'PowerDialer operation failed',
      message: error.message
    });
  }
}