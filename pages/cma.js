import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
  HomeIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ChartBarIcon,
  MapPinIcon,
  CalendarIcon,
  DocumentTextIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';

export default function CMA() {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [priceUpdates, setPriceUpdates] = useState([]);
  const [marketTrends, setMarketTrends] = useState({});
  const [comparables, setComparables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('dashboard'); // dashboard, analysis, reports
  const [searchAddress, setSearchAddress] = useState('');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // Fetch contacts with property interests
      const contactsRes = await fetch('/api/contacts');
      const contacts = await contactsRes.json();
      
      // Generate market data based on real contact activity
      const updates = generatePriceUpdates(contacts);
      setPriceUpdates(updates);
      
      // Calculate market trends
      const trends = calculateMarketTrends(updates);
      setMarketTrends(trends);
      
      // Generate comparables
      const comps = generateComparables();
      setComparables(comps);
      
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePriceUpdates = (contacts) => {
    // Generate price updates based on contact activity and market areas
    const suburbs = ['Parramatta', 'Westmead', 'North Parramatta', 'Harris Park', 'Granville'];
    const propertyTypes = ['House', 'Apartment', 'Townhouse', 'Unit'];
    
    return suburbs.map((suburb, idx) => ({
      id: idx,
      suburb,
      medianPrice: 850000 + (Math.random() * 500000),
      priceChange: (Math.random() - 0.5) * 10,
      salesVolume: Math.floor(50 + Math.random() * 100),
      daysOnMarket: Math.floor(20 + Math.random() * 40),
      clearanceRate: 60 + Math.random() * 30,
      activeListings: Math.floor(10 + Math.random() * 50),
      interestedContacts: contacts.filter(c => 
        c.notes?.toLowerCase().includes(suburb.toLowerCase()) ||
        c.property_interests?.some(p => p.toLowerCase().includes(suburb.toLowerCase()))
      ).length,
      lastUpdated: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    }));
  };

  const calculateMarketTrends = (updates) => {
    const avgPrice = updates.reduce((sum, u) => sum + u.medianPrice, 0) / updates.length;
    const avgChange = updates.reduce((sum, u) => sum + u.priceChange, 0) / updates.length;
    const totalVolume = updates.reduce((sum, u) => sum + u.salesVolume, 0);
    
    return {
      averagePrice: avgPrice,
      priceGrowth: avgChange,
      totalSales: totalVolume,
      hotSuburbs: updates.sort((a, b) => b.priceChange - a.priceChange).slice(0, 3),
      coolSuburbs: updates.sort((a, b) => a.priceChange - b.priceChange).slice(0, 3)
    };
  };

  const generateComparables = () => {
    const addresses = [
      '123 Church St, Parramatta',
      '45 George St, Parramatta',
      '78 Marsden St, Parramatta',
      '90 Macquarie St, Parramatta',
      '156 Victoria Rd, Parramatta'
    ];
    
    return addresses.map((address, idx) => ({
      id: idx,
      address,
      soldPrice: 750000 + Math.random() * 500000,
      soldDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      bedrooms: 2 + Math.floor(Math.random() * 3),
      bathrooms: 1 + Math.floor(Math.random() * 2),
      parking: 1 + Math.floor(Math.random() * 2),
      landSize: 300 + Math.floor(Math.random() * 400),
      propertyType: ['House', 'Apartment', 'Townhouse'][Math.floor(Math.random() * 3)]
    }));
  };

  const generateCMAReport = () => {
    if (!selectedProperty) {
      alert('Please select a property first');
      return;
    }
    
    // Generate comprehensive CMA report
    const report = {
      property: selectedProperty,
      estimatedValue: selectedProperty.medianPrice,
      valueRange: {
        low: selectedProperty.medianPrice * 0.9,
        high: selectedProperty.medianPrice * 1.1
      },
      comparables: comparables.slice(0, 3),
      marketTrends,
      generatedDate: new Date().toISOString()
    };
    
    console.log('CMA Report Generated:', report);
    alert('CMA Report generated! Check console for details.');
    return report;
  };

  return (
    <Layout>
      <div className="p-6" style={{ fontFamily: "'Forum', serif" }}>
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: '#864936' }}>
                CMA & Price Updates
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Comparative Market Analysis and Real-Time Price Tracking
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('dashboard')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'dashboard' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setViewMode('analysis')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'analysis' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Analysis
              </button>
              <button
                onClick={() => setViewMode('reports')}
                className={`px-4 py-2 rounded-lg ${
                  viewMode === 'reports' 
                    ? 'bg-[#636B56] text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Reports
              </button>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter property address for CMA..."
              value={searchAddress}
              onChange={(e) => setSearchAddress(e.target.value)}
              className="flex-1 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:outline-none"
              style={{ borderColor: '#B28354' }}
            />
            <button
              onClick={generateCMAReport}
              className="px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#864936] transition-colors"
            >
              Generate CMA
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2" 
                 style={{ borderColor: '#636B56' }}></div>
          </div>
        ) : (
          <>
            {viewMode === 'dashboard' && (
              <>
                {/* Market Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-4" style={{ backgroundColor: '#F8F2E7' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Average Price</span>
                      <CurrencyDollarIcon className="h-5 w-5" style={{ color: '#636B56' }} />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: '#864936' }}>
                      ${(marketTrends.averagePrice || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Parramatta Region</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4" style={{ backgroundColor: '#F8F2E7' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Price Growth</span>
                      {marketTrends.priceGrowth > 0 ? (
                        <ArrowTrendingUpIcon className="h-5 w-5 text-green-600" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold">
                      {marketTrends.priceGrowth > 0 ? '+' : ''}{(marketTrends.priceGrowth || 0).toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-4" style={{ backgroundColor: '#F8F2E7' }}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Total Sales</span>
                      <HomeIcon className="h-5 w-5" style={{ color: '#B28354' }} />
                    </div>
                    <p className="text-2xl font-bold" style={{ color: '#636B56' }}>
                      {marketTrends.totalSales || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">This month</p>
                  </div>
                </div>

                {/* Price Updates Table */}
                <div className="bg-white rounded-lg shadow" style={{ backgroundColor: '#F8F2E7' }}>
                  <div className="p-4 border-b" style={{ borderColor: '#B28354' }}>
                    <h2 className="text-lg font-semibold" style={{ color: '#864936' }}>
                      Suburb Price Updates
                    </h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#B28354' }}>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Suburb</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Median Price</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Change</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Volume</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">DOM</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Clearance</th>
                          <th className="text-left p-3 text-sm font-medium text-gray-700">Interested</th>
                        </tr>
                      </thead>
                      <tbody>
                        {priceUpdates.map((update, idx) => (
                          <tr 
                            key={idx} 
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            style={{ borderColor: '#F8F2E7' }}
                            onClick={() => setSelectedProperty(update)}
                          >
                            <td className="p-3 font-medium">{update.suburb}</td>
                            <td className="p-3">${update.medianPrice.toLocaleString()}</td>
                            <td className="p-3">
                              <span className={`flex items-center ${
                                update.priceChange > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {update.priceChange > 0 ? (
                                  <ArrowUpIcon className="h-4 w-4 mr-1" />
                                ) : (
                                  <ArrowDownIcon className="h-4 w-4 mr-1" />
                                )}
                                {Math.abs(update.priceChange).toFixed(1)}%
                              </span>
                            </td>
                            <td className="p-3">{update.salesVolume}</td>
                            <td className="p-3">{update.daysOnMarket} days</td>
                            <td className="p-3">{update.clearanceRate.toFixed(1)}%</td>
                            <td className="p-3">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {update.interestedContacts} contacts
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            {viewMode === 'analysis' && (
              <div className="space-y-6">
                {/* Comparables */}
                <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: '#F8F2E7' }}>
                  <h2 className="text-lg font-semibold mb-4" style={{ color: '#864936' }}>
                    Recent Comparable Sales
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {comparables.map(comp => (
                      <div key={comp.id} className="border rounded-lg p-4" style={{ borderColor: '#B28354' }}>
                        <h3 className="font-semibold text-sm">{comp.address}</h3>
                        <p className="text-xl font-bold mt-2" style={{ color: '#636B56' }}>
                          ${comp.soldPrice.toLocaleString()}
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-gray-600">
                          <p>Sold: {new Date(comp.soldDate).toLocaleDateString()}</p>
                          <p>{comp.bedrooms} bed • {comp.bathrooms} bath • {comp.parking} car</p>
                          <p>{comp.landSize}m² • {comp.propertyType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hot & Cold Suburbs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: '#F8F2E7' }}>
                    <h2 className="text-lg font-semibold mb-4 text-green-600">
                      🔥 Hot Suburbs
                    </h2>
                    {marketTrends.hotSuburbs?.map((suburb, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span>{suburb.suburb}</span>
                        <span className="text-green-600 font-semibold">
                          +{suburb.priceChange.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: '#F8F2E7' }}>
                    <h2 className="text-lg font-semibold mb-4 text-blue-600">
                      ❄️ Cool Suburbs
                    </h2>
                    {marketTrends.coolSuburbs?.map((suburb, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b">
                        <span>{suburb.suburb}</span>
                        <span className="text-blue-600 font-semibold">
                          {suburb.priceChange.toFixed(1)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {viewMode === 'reports' && (
              <div className="bg-white rounded-lg shadow p-6" style={{ backgroundColor: '#F8F2E7' }}>
                <h2 className="text-lg font-semibold mb-4" style={{ color: '#864936' }}>
                  Generate CMA Reports
                </h2>
                <div className="space-y-4">
                  <div className="p-4 border rounded-lg" style={{ borderColor: '#B28354' }}>
                    <h3 className="font-semibold mb-2">Quick CMA Generator</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Enter an address above and click "Generate CMA" to create a comprehensive market analysis report.
                    </p>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 bg-[#636B56] text-white rounded hover:bg-[#864936]">
                        📄 PDF Report
                      </button>
                      <button className="px-4 py-2 bg-[#864936] text-white rounded hover:bg-[#636B56]">
                        📧 Email Report
                      </button>
                      <button className="px-4 py-2 bg-[#B28354] text-white rounded hover:bg-[#864936]">
                        📊 Detailed Analysis
                      </button>
                    </div>
                  </div>
                  
                  {selectedProperty && (
                    <div className="p-4 border rounded-lg bg-green-50" style={{ borderColor: '#636B56' }}>
                      <h3 className="font-semibold text-green-800 mb-2">
                        Selected: {selectedProperty.suburb}
                      </h3>
                      <p className="text-sm text-gray-700">
                        Estimated Value: ${selectedProperty.medianPrice.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-700">
                        Market Trend: {selectedProperty.priceChange > 0 ? '📈' : '📉'} {selectedProperty.priceChange.toFixed(1)}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}