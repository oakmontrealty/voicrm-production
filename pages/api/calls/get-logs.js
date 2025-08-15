// Get call logs with AI summaries
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get call logs from memory (in production, query from database)
    const callLogs = global.callLogs || [];
    
    // Add mock data if no calls exist yet
    if (callLogs.length === 0) {
      global.callLogs = [
        {
          id: 'call_demo_1',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          phoneNumber: '+61411222333',
          duration: 245,
          direction: 'outbound',
          status: 'completed',
          summary: {
            overview: "Customer interested in 3-bedroom properties in Parramatta. Budget $850K-$950K.",
            sentiment: "Positive",
            urgency: "High",
            nextSteps: "Schedule property viewing for Saturday",
            keyPoints: [
              "Looking for family home",
              "Needs 3 bedrooms minimum",
              "Preferred suburbs: Parramatta, Westmead",
              "Pre-approved for $900K loan"
            ],
            actionItems: [
              "Send property listings in Parramatta",
              "Book viewing for 123 Main St",
              "Follow up on Friday"
            ]
          }
        },
        {
          id: 'call_demo_2',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          phoneNumber: '+61422333444',
          duration: 180,
          direction: 'inbound',
          status: 'completed',
          summary: {
            overview: "Vendor wants property valuation for potential listing.",
            sentiment: "Neutral",
            urgency: "Medium",
            nextSteps: "Schedule property appraisal next week",
            keyPoints: [
              "Considering selling investment property",
              "Located at 456 Church St, Westmead",
              "Wants market analysis",
              "Timeline: 2-3 months"
            ],
            actionItems: [
              "Prepare CMA report",
              "Schedule appraisal",
              "Send recent sales data"
            ]
          }
        },
        {
          id: 'call_demo_3',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          phoneNumber: '+61433444555',
          duration: 120,
          direction: 'outbound',
          status: 'completed',
          summary: {
            overview: "Follow-up call about auction registration.",
            sentiment: "Positive",
            urgency: "High",
            nextSteps: "Confirm auction attendance Saturday 2pm",
            keyPoints: [
              "Interested in 789 George St property",
              "Will attend auction this Saturday",
              "Needs auction pack",
              "Bringing partner to viewing"
            ],
            actionItems: [
              "Send auction pack via email",
              "Confirm registration",
              "Arrange pre-auction inspection"
            ]
          }
        }
      ];
    }

    return res.status(200).json({
      success: true,
      calls: global.callLogs || [],
      total: (global.callLogs || []).length
    });
  } catch (error) {
    console.error('Error fetching call logs:', error);
    return res.status(500).json({
      error: 'Failed to fetch call logs',
      message: error.message
    });
  }
}