export default async function handler(req, res) {
  const { method } = req;

  // Mock leads data
  const mockLeads = [
    {
      id: '1',
      name: 'Alice Thompson',
      email: 'alice@example.com',
      phone: '(555) 111-2222',
      company: 'Thompson Enterprises',
      status: 'New',
      priority: 'High',
      source: 'Website',
      value: 250000,
      notes: 'Interested in luxury condos',
      tags: ['luxury', 'condo'],
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Bob Wilson',
      email: 'bob@example.com',
      phone: '(555) 333-4444',
      company: 'Wilson & Co',
      status: 'Qualified',
      priority: 'Medium',
      source: 'Referral',
      value: 180000,
      notes: 'Looking for office space',
      tags: ['commercial', 'office'],
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Carol Davis',
      email: 'carol@example.com',
      phone: '(555) 555-6666',
      company: 'Davis Industries',
      status: 'Proposal',
      priority: 'Urgent',
      source: 'Cold Call',
      value: 320000,
      notes: 'Ready to buy this month',
      tags: ['urgent', 'residential'],
      created_at: new Date().toISOString()
    }
  ];

  switch (method) {
    case 'GET':
      try {
        res.status(200).json(mockLeads);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'POST':
      try {
        const newLead = {
          id: Date.now().toString(),
          ...req.body,
          created_at: new Date().toISOString()
        };
        res.status(201).json(newLead);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'PUT':
      try {
        const { id, ...updateData } = req.body;
        const updatedLead = {
          id,
          ...updateData,
          updated_at: new Date().toISOString()
        };
        res.status(200).json(updatedLead);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    case 'DELETE':
      try {
        const { id } = req.query;
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}