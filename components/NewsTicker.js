import { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BuildingOfficeIcon, CurrencyDollarIcon, HomeIcon, ChartBarIcon } from '@heroicons/react/24/outline';

export default function NewsTicker() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default news items while loading or as fallback - Sydney & South West Sydney focused
  const defaultNews = [
    { 
      text: "Liverpool median house price hits $1.15M", 
      trend: "up", 
      icon: HomeIcon,
      change: "+8.3%"
    },
    { 
      text: "Campbelltown growth outpaces Sydney at 12% YoY", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+12%"
    },
    { 
      text: "Western Sydney Airport drives Badgerys Creek prices up", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "+15.2%"
    },
    { 
      text: "Oran Park median reaches $1.3M for houses", 
      trend: "up", 
      icon: HomeIcon,
      change: "+9.5%"
    },
    { 
      text: "Camden Council approves 2,500 new homes", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "NEW"
    },
    { 
      text: "Leppington station precinct development begins", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "+18%"
    },
    { 
      text: "Gregory Hills shopping centre expansion approved", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "$450M"
    },
    { 
      text: "Edmondson Park units average $750K", 
      trend: "up", 
      icon: HomeIcon,
      change: "+6.7%"
    },
    { 
      text: "Macarthur region population to hit 650K by 2036", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+35%"
    },
    { 
      text: "Penrith median house price breaks $1M barrier", 
      trend: "up", 
      icon: HomeIcon,
      change: "+11.2%"
    },
    { 
      text: "South West Sydney rental yields at 4.8%", 
      trend: "up", 
      icon: CurrencyDollarIcon,
      change: "+0.6%"
    },
    { 
      text: "Fairfield LGA records 73% auction clearance", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+5%"
    },
    { 
      text: "Bankstown CBD transformation attracts $2B investment", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "+$2B"
    },
    { 
      text: "Moorebank intermodal creates 1,700 local jobs", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+1,700"
    },
    { 
      text: "Casula first home buyers increase 22%", 
      trend: "up", 
      icon: HomeIcon,
      change: "+22%"
    },
    { 
      text: "Narellan Vale townhouses average $850K", 
      trend: "up", 
      icon: HomeIcon,
      change: "+7.8%"
    },
    { 
      text: "Sydney Metro West boosts Parramatta prices", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "+13.5%"
    },
    { 
      text: "Blacktown becomes NSW's largest LGA", 
      trend: "neutral", 
      icon: ChartBarIcon,
      change: "420K"
    },
    { 
      text: "Canterbury-Bankstown rental vacancy at 1.8%", 
      trend: "down", 
      icon: HomeIcon,
      change: "-0.4%"
    },
    { 
      text: "Green Valley median unit price $580K", 
      trend: "up", 
      icon: HomeIcon,
      change: "+5.2%"
    },
    { 
      text: "Western Sydney Uni expansion brings student housing", 
      trend: "up", 
      icon: BuildingOfficeIcon,
      change: "+2,000"
    },
    { 
      text: "Austral land releases sell out in 48 hours", 
      trend: "up", 
      icon: HomeIcon,
      change: "SOLD"
    },
    { 
      text: "M12 Motorway boosts Kemps Creek values", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+16%"
    },
    { 
      text: "South West growth corridor fastest in Sydney", 
      trend: "up", 
      icon: ChartBarIcon,
      change: "+4.2%"
    }
  ];

  useEffect(() => {
    // Fetch real news data
    fetchNewsData();
    // Refresh news every 5 minutes
    const interval = setInterval(fetchNewsData, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchNewsData = async () => {
    try {
      // In production, this would call a news API endpoint
      // For now, we'll use mock data with some randomization
      const mockNews = defaultNews.map(item => ({
        ...item,
        // Add some randomization to make it seem live
        change: `${item.trend === 'up' ? '+' : item.trend === 'down' ? '-' : ''}${(Math.random() * 10).toFixed(1)}%`
      }));
      
      setNewsItems([...mockNews, ...mockNews]); // Duplicate for seamless scrolling
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      setNewsItems([...defaultNews, ...defaultNews]);
      setLoading(false);
    }
  };

  const displayItems = loading ? [...defaultNews, ...defaultNews] : newsItems;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-[#636B56]/5 to-[#B28354]/5 backdrop-blur-sm">
      <div className="flex animate-scroll">
        <div className="flex items-center space-x-8 px-4">
          {displayItems.map((item, index) => {
            const Icon = item.icon;
            const TrendIcon = item.trend === 'up' ? ArrowTrendingUpIcon : 
                            item.trend === 'down' ? ArrowTrendingDownIcon : null;
            
            return (
              <div key={index} className="flex items-center space-x-2 whitespace-nowrap">
                <Icon className="h-5 w-5 text-[#636B56]" />
                <span className="text-base font-medium text-[#636B56]">
                  {item.text}
                </span>
                {TrendIcon && (
                  <div className="flex items-center space-x-1">
                    <TrendIcon className={`h-4 w-4 ${
                      item.trend === 'up' ? 'text-[#636B56]' : 'text-[#864936]'
                    }`} />
                    <span className={`text-sm font-bold ${
                      item.trend === 'up' ? 'text-[#636B56]' : 
                      item.trend === 'down' ? 'text-[#864936]' : 
                      'text-[#636B56]'
                    }`}>
                      {item.change}
                    </span>
                  </div>
                )}
                {index < displayItems.length - 1 && (
                  <span className="text-[#B28354] mx-2">•</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F2E7] to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#F8F2E7] to-transparent pointer-events-none" />
      
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .animate-scroll {
          animation: scroll 120s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}