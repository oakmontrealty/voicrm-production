import { useState, useEffect } from 'react';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, BuildingOfficeIcon, CurrencyDollarIcon, HomeIcon, ChartBarIcon, NewspaperIcon } from '@heroicons/react/24/outline';

export default function NewsTicker() {
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  // Icon mapping based on category
  const getIcon = (category) => {
    switch(category) {
      case 'price':
      case 'buyers':
        return HomeIcon;
      case 'infrastructure':
      case 'development':
        return BuildingOfficeIcon;
      case 'investment':
      case 'rental':
        return CurrencyDollarIcon;
      case 'growth':
        return ChartBarIcon;
      default:
        return NewspaperIcon;
    }
  };

  useEffect(() => {
    fetchNewsData();
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNewsData, 1800000);
    return () => clearInterval(interval);
  }, []);

  const fetchNewsData = async () => {
    try {
      const response = await fetch('/api/news-with-summary');
      const data = await response.json();
      
      // Duplicate for seamless scrolling
      setNewsItems([...data, ...data]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching news:', error);
      // Use default news if API fails
      fetchDefaultNews();
    }
  };

  const fetchDefaultNews = () => {
    const defaultNews = [
      {
        title: "Liverpool median house price hits $1.15M",
        aiSummary: "8.3% YoY growth driven by Western Sydney Airport proximity and infrastructure improvements",
        trend: "up",
        change: "+8.3%",
        category: "price"
      },
      {
        title: "Western Sydney Airport drives Badgerys Creek boom",
        aiSummary: "Properties within 10km surging 15.2% as investors capitalize on 2026 opening",
        trend: "up",
        change: "+15.2%",
        category: "infrastructure"
      },
      {
        title: "Camden Council approves 2,500 new homes",
        aiSummary: "Major development to ease supply pressure while maintaining infrastructure standards",
        trend: "up",
        change: "2,500",
        category: "development"
      },
      {
        title: "South West Sydney rental yields at 4.8%",
        aiSummary: "Outperforming inner-city by 0.6% due to population growth and limited supply",
        trend: "up",
        change: "+0.6%",
        category: "investment"
      },
      {
        title: "Campbelltown growth outpaces Sydney at 12%",
        aiSummary: "Nearly double Sydney's average, driven by affordability and infrastructure investment",
        trend: "up",
        change: "+12%",
        category: "growth"
      }
    ];
    
    setNewsItems([...defaultNews, ...defaultNews]);
    setLoading(false);
  };

  const displayItems = newsItems.length > 0 ? newsItems : [];

  if (displayItems.length === 0) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-[#636B56]/5 to-[#B28354]/5 backdrop-blur-sm py-3">
        <div className="flex items-center justify-center">
          <span className="text-[#636B56] text-sm">Loading market updates...</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-[#636B56]/5 to-[#B28354]/5 backdrop-blur-sm py-3"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* News Label */}
      <div className="absolute left-0 top-0 bottom-0 z-10 bg-[#636B56] px-4 flex items-center">
        <NewspaperIcon className="h-5 w-5 text-white mr-2" />
        <span className="text-white font-bold text-sm uppercase tracking-wider">Live Market</span>
      </div>
      
      {/* Scrolling Content */}
      <div className={`flex ${isPaused ? '' : 'animate-scroll'} ml-32`}>
        <div className="flex items-center">
          {displayItems.map((item, index) => {
            const Icon = getIcon(item.category);
            const TrendIcon = item.trend === 'up' ? ArrowTrendingUpIcon : 
                            item.trend === 'down' ? ArrowTrendingDownIcon : null;
            
            return (
              <div key={index} className="flex items-center mr-12 whitespace-nowrap group">
                <Icon className="h-5 w-5 text-[#636B56] mr-2 flex-shrink-0" />
                
                <div className="flex flex-col">
                  {/* Headline */}
                  <div className="flex items-center">
                    <span className="text-base font-bold text-[#636B56] mr-2">
                      {item.title}
                    </span>
                    {TrendIcon && (
                      <div className="flex items-center">
                        <TrendIcon className={`h-4 w-4 ${
                          item.trend === 'up' ? 'text-[#25D366]' : 'text-[#864936]'
                        }`} />
                        <span className={`text-sm font-bold ml-1 ${
                          item.trend === 'up' ? 'text-[#25D366]' : 
                          item.trend === 'down' ? 'text-[#864936]' : 
                          'text-[#636B56]'
                        }`}>
                          {item.change}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {/* AI Summary */}
                  <span className="text-sm text-[#864936] mt-0.5 opacity-90">
                    {item.aiSummary}
                  </span>
                </div>
                
                {/* Separator */}
                {index < displayItems.length - 1 && (
                  <span className="text-[#B28354] text-2xl mx-8">•</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Gradient overlays for fade effect */}
      <div className="absolute left-32 top-0 bottom-0 w-20 bg-gradient-to-r from-[#F8F2E7] to-transparent pointer-events-none" />
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
          animation: scroll 180s linear infinite;
        }
        
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}// Deployment trigger Fri, Aug 15, 2025  8:52:32 PM
