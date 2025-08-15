export default function handler(req, res) {
  if (req.method === 'GET') {
    // Return sample pipeline data
    const pipelineData = {
      stages: [
        { id: 'lead', name: 'Lead', count: 15, value: 750000 },
        { id: 'qualified', name: 'Qualified', count: 8, value: 520000 },
        { id: 'proposal', name: 'Proposal', count: 5, value: 380000 },
        { id: 'negotiation', name: 'Negotiation', count: 3, value: 280000 },
        { id: 'closed', name: 'Closed Won', count: 12, value: 960000 }
      ],
      deals: generateSampleDeals(),
      stats: {
        totalValue: 2890000,
        avgDealSize: 67442,
        conversionRate: 27.9,
        avgCycleTime: 21
      }
    };
    
    return res.status(200).json(pipelineData);
  }
  
  if (req.method === 'POST') {
    // Handle deal updates
    const { action, dealId, data } = req.body;
    
    if (action === 'move') {
      return res.status(200).json({
        success: true,
        message: `Deal ${dealId} moved to ${data.stage}`
      });
    }
    
    if (action === 'update') {
      return res.status(200).json({
        success: true,
        deal: { id: dealId, ...data }
      });
    }
    
    if (action === 'create') {
      return res.status(200).json({
        success: true,
        deal: {
          id: Date.now().toString(),
          ...data,
          created_at: new Date().toISOString()
        }
      });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
}

function generateSampleDeals() {
  const companies = [
    'Thompson Enterprises', 'Wilson & Co', 'Davis Industries',
    'Martinez Group', 'Anderson LLC', 'Taylor Solutions',
    'Brown Consulting', 'Garcia Ventures', 'Miller Holdings',
    'Rodriguez Corp', 'Lewis Partners', 'Walker Investments'
  ];
  
  const stages = ['lead', 'qualified', 'proposal', 'negotiation', 'closed'];
  const owners = ['John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Williams'];
  
  return companies.map((company, i) => ({
    id: (i + 1).toString(),
    name: `Deal with ${company}`,
    company,
    value: Math.floor(Math.random() * 200000) + 20000,
    stage: stages[Math.floor(Math.random() * stages.length)],
    probability: [20, 40, 60, 80, 100][Math.floor(Math.random() * 5)],
    owner: owners[Math.floor(Math.random() * owners.length)],
    daysInStage: Math.floor(Math.random() * 30),
    nextAction: ['Call', 'Email', 'Meeting', 'Proposal'][Math.floor(Math.random() * 4)],
    lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
  }));
}