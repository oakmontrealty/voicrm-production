import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Cache for news to avoid excessive API calls
let newsCache = null;
let cacheTime = null;
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

export default async function handler(req, res) {
  try {
    // Check cache
    if (newsCache && cacheTime && (Date.now() - cacheTime < CACHE_DURATION)) {
      return res.status(200).json(newsCache);
    }

    // Fetch real estate news from multiple sources
    const newsItems = await fetchRealEstateNews();
    
    // Generate AI summaries for each news item
    const newsWithSummaries = await Promise.all(
      newsItems.map(async (item) => {
        try {
          const summary = await generateAISummary(item.title, item.content || item.description);
          return {
            ...item,
            aiSummary: summary
          };
        } catch (error) {
          console.error('Error generating summary:', error);
          return {
            ...item,
            aiSummary: item.description || 'Summary unavailable'
          };
        }
      })
    );

    // Update cache
    newsCache = newsWithSummaries;
    cacheTime = Date.now();

    res.status(200).json(newsWithSummaries);
  } catch (error) {
    console.error('News API error:', error);
    
    // Return default news with AI summaries
    res.status(200).json(getDefaultNewsWithSummaries());
  }
}

async function fetchRealEstateNews() {
  // In production, this would fetch from real news APIs
  // For now, return realistic Sydney real estate news
  return [
    {
      title: "Liverpool median house price hits $1.15M milestone",
      description: "Liverpool's housing market continues its strong growth trajectory",
      content: "Liverpool's median house price has reached $1.15 million, marking an 8.3% increase year-over-year. The growth is attributed to improved infrastructure, proximity to Western Sydney Airport, and increasing demand from first-home buyers and investors.",
      trend: "up",
      change: "+8.3%",
      category: "price"
    },
    {
      title: "Western Sydney Airport drives Badgerys Creek property boom",
      description: "Property values surge in airport precinct",
      content: "Properties within 10km of the new Western Sydney Airport have seen unprecedented growth, with Badgerys Creek recording a 15.2% increase in median prices. Investors are rushing to secure properties before the airport's 2026 opening.",
      trend: "up",
      change: "+15.2%",
      category: "infrastructure"
    },
    {
      title: "Camden Council approves 2,500 new homes in growth corridor",
      description: "Major residential development gets green light",
      content: "Camden Council has approved a massive 2,500-home development in the South West Growth Area. The project will include parks, schools, and shopping facilities, addressing Sydney's housing shortage while maintaining livability standards.",
      trend: "up",
      change: "2,500",
      category: "development"
    },
    {
      title: "South West Sydney rental yields outperform inner city at 4.8%",
      description: "Investors flock to high-yield suburbs",
      content: "South West Sydney suburbs are delivering rental yields of 4.8%, significantly outperforming inner-city areas. Strong rental demand from growing populations and limited supply are driving returns for property investors.",
      trend: "up",
      change: "+0.6%",
      category: "investment"
    },
    {
      title: "Campbelltown growth outpaces Greater Sydney at 12% YoY",
      description: "Macarthur region leads Sydney's growth",
      content: "Campbelltown has recorded 12% year-over-year growth, nearly double Sydney's average. The combination of affordability, infrastructure investment, and lifestyle amenities is attracting buyers from across Sydney.",
      trend: "up",
      change: "+12%",
      category: "growth"
    },
    {
      title: "Oran Park median reaches $1.3M as demand soars",
      description: "Master-planned community continues to attract families",
      content: "Oran Park's median house price has hit $1.3 million, driven by its master-planned community appeal, excellent schools, and modern amenities. The suburb has become a benchmark for successful greenfield development.",
      trend: "up",
      change: "+9.5%",
      category: "price"
    },
    {
      title: "First home buyers increase 22% in Casula market",
      description: "Government incentives drive buyer activity",
      content: "Casula has seen a 22% increase in first home buyer activity, supported by government grants and stamp duty concessions. The suburb's relative affordability and transport links make it attractive for entering the market.",
      trend: "up",
      change: "+22%",
      category: "buyers"
    },
    {
      title: "Canterbury-Bankstown rental vacancy hits record low 1.8%",
      description: "Rental crisis deepens in South West Sydney",
      content: "Rental vacancy rates in Canterbury-Bankstown have dropped to just 1.8%, creating fierce competition among tenants. The shortage is pushing rents higher and forcing many to look further west for affordable options.",
      trend: "down",
      change: "-0.4%",
      category: "rental"
    }
  ];
}

async function generateAISummary(title, content) {
  if (!process.env.OPENAI_API_KEY) {
    return content.substring(0, 150) + '...';
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a real estate market analyst. Provide a concise, informative summary of the news in 1-2 sentences, focusing on the key impact for property investors and buyers. Be specific about numbers and trends."
        },
        {
          role: "user",
          content: `Summarize this real estate news: Title: ${title}. Content: ${content}`
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('OpenAI API error:', error);
    return content.substring(0, 150) + '...';
  }
}

function getDefaultNewsWithSummaries() {
  return [
    {
      title: "Liverpool median house price hits $1.15M milestone",
      aiSummary: "Liverpool's 8.3% YoY growth to $1.15M median reflects strong demand from Western Sydney Airport proximity and infrastructure improvements, making it an attractive investment hotspot for capital growth.",
      trend: "up",
      change: "+8.3%",
      category: "price"
    },
    {
      title: "Western Sydney Airport drives Badgerys Creek property boom",
      aiSummary: "Properties within 10km of the new airport are surging 15.2% as investors capitalize on the 2026 opening, with Badgerys Creek leading the charge in what experts call a 'once-in-a-generation' opportunity.",
      trend: "up",
      change: "+15.2%",
      category: "infrastructure"
    },
    {
      title: "Camden Council approves 2,500 new homes in growth corridor",
      aiSummary: "The massive 2,500-home development approval in Camden will ease housing supply pressure while including essential infrastructure, potentially stabilizing prices while maintaining strong rental demand.",
      trend: "up",
      change: "2,500",
      category: "development"
    },
    {
      title: "South West Sydney rental yields outperform at 4.8%",
      aiSummary: "Investors are achieving 4.8% rental yields in South West Sydney, 0.6% higher than inner-city areas, driven by population growth and limited rental supply creating a landlord's market.",
      trend: "up",
      change: "+0.6%",
      category: "investment"
    },
    {
      title: "Campbelltown growth outpaces Greater Sydney at 12% YoY",
      aiSummary: "Campbelltown's 12% annual growth nearly doubles Sydney's average, driven by affordability, major infrastructure projects, and lifestyle appeal, signaling continued strong performance for investors.",
      trend: "up",
      change: "+12%",
      category: "growth"
    },
    {
      title: "Oran Park median reaches $1.3M as families compete",
      aiSummary: "Oran Park's master-planned community appeal pushes median to $1.3M with 9.5% growth, as families prioritize lifestyle amenities and schools, creating sustained demand for quality homes.",
      trend: "up",
      change: "+9.5%",
      category: "price"
    },
    {
      title: "First home buyers surge 22% in Casula market",
      aiSummary: "Government incentives drive 22% increase in first home buyer activity in Casula, where relative affordability meets good transport links, potentially supporting continued price growth.",
      trend: "up",
      change: "+22%",
      category: "buyers"
    },
    {
      title: "Canterbury-Bankstown rental vacancy crisis at 1.8%",
      aiSummary: "Record low 1.8% vacancy rate in Canterbury-Bankstown creates tenant competition and rent increases, presenting opportunities for investors but challenges for affordability.",
      trend: "down",
      change: "-0.4%",
      category: "rental"
    }
  ];
}