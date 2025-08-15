// API endpoint for fetching real estate and finance news
// In production, this would connect to news APIs like Google News, Reuters, Bloomberg, etc.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Mock news data - in production this would fetch from real APIs
    const newsItems = [
      {
        text: "Sydney median house price reaches $1.6M",
        trend: "up",
        change: "+2.3%",
        category: "property",
        source: "Domain"
      },
      {
        text: "RBA holds interest rate at 4.35%",
        trend: "neutral",
        change: "0.00%",
        category: "finance",
        source: "RBA"
      },
      {
        text: "Commercial property yields rise to 6.2%",
        trend: "up",
        change: "+0.8%",
        category: "commercial",
        source: "CoreLogic"
      },
      {
        text: "First home buyer activity up 15%",
        trend: "up",
        change: "+15%",
        category: "market",
        source: "ABS"
      },
      {
        text: "Melbourne apartment oversupply concerns",
        trend: "down",
        change: "-3.1%",
        category: "property",
        source: "REA"
      },
      {
        text: "Regional property demand surges 20%",
        trend: "up",
        change: "+20%",
        category: "regional",
        source: "PropTrack"
      },
      {
        text: "Construction costs stabilize after 18-month rise",
        trend: "neutral",
        change: "+0.2%",
        category: "construction",
        source: "HIA"
      },
      {
        text: "Foreign investment in AU property up 8%",
        trend: "up",
        change: "+8%",
        category: "investment",
        source: "FIRB"
      },
      {
        text: "Brisbane rental yields hit 5-year high",
        trend: "up",
        change: "+4.5%",
        category: "rental",
        source: "SQM Research"
      },
      {
        text: "Housing affordability improves in Perth",
        trend: "up",
        change: "+6.2%",
        category: "affordability",
        source: "ANZ"
      }
    ];

    // Add timestamp and randomize slightly for live feel
    const liveNews = newsItems.map(item => ({
      ...item,
      timestamp: new Date().toISOString(),
      id: Math.random().toString(36).substr(2, 9)
    }));

    res.status(200).json({
      success: true,
      data: liveNews,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch news data'
    });
  }
}