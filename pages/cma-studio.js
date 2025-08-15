import { useState } from 'react';
import Layout from '../components/Layout';

export default function CMAStudio() {
  const [selectedTemplate, setSelectedTemplate] = useState('residential');
  const [propertyData, setPropertyData] = useState({
    address: '',
    bedrooms: 3,
    bathrooms: 2,
    landSize: 650,
    propertyType: 'house',
    suburb: 'Parramatta'
  });

  const templates = [
    {
      id: 'residential',
      name: 'Residential CMA',
      description: 'Standard residential property market analysis',
      icon: '🏠',
      sections: ['Property Details', 'Recent Sales', 'Market Trends', 'Pricing Strategy', 'Marketing Plan']
    },
    {
      id: 'investment',
      name: 'Investment Analysis',
      description: 'ROI and rental yield focused analysis',
      icon: '💰',
      sections: ['Property Details', 'Rental Analysis', 'ROI Calculations', 'Market Comparison', 'Investment Strategy']
    },
    {
      id: 'luxury',
      name: 'Luxury Property',
      description: 'Premium property market positioning',
      icon: '🏰',
      sections: ['Executive Summary', 'Property Features', 'Luxury Market Analysis', 'Target Buyer Profile', 'Marketing Strategy']
    },
    {
      id: 'commercial',
      name: 'Commercial CMA',
      description: 'Commercial property valuation and analysis',
      icon: '🏢',
      sections: ['Property Overview', 'Lease Analysis', 'Cap Rate Analysis', 'Market Comparables', 'Investment Summary']
    },
    {
      id: 'development',
      name: 'Development Site',
      description: 'Land and development potential analysis',
      icon: '🏗️',
      sections: ['Site Analysis', 'Development Potential', 'Feasibility Study', 'Market Demand', 'Project Timeline']
    },
    {
      id: 'quick',
      name: 'Quick Appraisal',
      description: 'Fast market appraisal for initial discussions',
      icon: '⚡',
      sections: ['Property Snapshot', 'Price Estimate', 'Recent Sales', 'Next Steps']
    }
  ];

  const [comparableProperties] = useState([
    { address: '123 Main St, Parramatta', price: 850000, bedrooms: 3, bathrooms: 2, soldDate: '2024-07-15', daysOnMarket: 28 },
    { address: '456 Oak Ave, Parramatta', price: 920000, bedrooms: 3, bathrooms: 2, soldDate: '2024-06-20', daysOnMarket: 35 },
    { address: '789 Elm Dr, Parramatta', price: 795000, bedrooms: 3, bathrooms: 2, soldDate: '2024-08-01', daysOnMarket: 21 },
    { address: '321 Pine Rd, Parramatta', price: 880000, bedrooms: 4, bathrooms: 2, soldDate: '2024-07-10', daysOnMarket: 42 }
  ]);

  const generateCMA = () => {
    // In production, this would generate a PDF report
    alert(`Generating ${templates.find(t => t.id === selectedTemplate).name} report...`);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                CMA Studio
              </h1>
              <p className="text-[#7a7a7a] mt-2">Comparative Market Analysis with professional templates</p>
            </div>
            <button 
              onClick={generateCMA}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Choose Template</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedTemplate === template.id 
                    ? 'border-[#636B56] bg-[#636B56]/5' 
                    : 'border-gray-200 hover:border-[#B28354]'
                }`}
              >
                <div className="text-3xl mb-2">{template.icon}</div>
                <h3 className="font-medium">{template.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Property Details */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Property Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Address</label>
                <input
                  type="text"
                  value={propertyData.address}
                  onChange={(e) => setPropertyData({...propertyData, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                  placeholder="Enter property address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms</label>
                  <input
                    type="number"
                    value={propertyData.bedrooms}
                    onChange={(e) => setPropertyData({...propertyData, bedrooms: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms</label>
                  <input
                    type="number"
                    value={propertyData.bathrooms}
                    onChange={(e) => setPropertyData({...propertyData, bathrooms: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Land Size (sqm)</label>
                <input
                  type="number"
                  value={propertyData.landSize}
                  onChange={(e) => setPropertyData({...propertyData, landSize: parseInt(e.target.value)})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <select
                  value={propertyData.propertyType}
                  onChange={(e) => setPropertyData({...propertyData, propertyType: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                >
                  <option value="house">House</option>
                  <option value="unit">Unit</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>
            </div>
          </div>

          {/* Market Analysis */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Market Analysis</h2>
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg p-4">
                <p className="text-sm opacity-90">Estimated Market Value</p>
                <p className="text-3xl font-bold">$850,000 - $920,000</p>
                <p className="text-sm mt-2 opacity-90">Based on {comparableProperties.length} comparable sales</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Median Price</p>
                  <p className="text-xl font-bold text-[#636B56]">$865,000</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Price per sqm</p>
                  <p className="text-xl font-bold text-[#636B56]">$1,331</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Days on Market</p>
                  <p className="text-xl font-bold text-[#636B56]">31 days</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-600">Growth (12mo)</p>
                  <p className="text-xl font-bold text-green-600">+8.5%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Comparable Properties */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Comparable Properties</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Address</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Sale Price</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Beds/Baths</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Sold Date</th>
                  <th className="text-left py-2 px-2 text-sm font-medium text-gray-700">Days on Market</th>
                </tr>
              </thead>
              <tbody>
                {comparableProperties.map((property, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-sm">{property.address}</td>
                    <td className="py-2 px-2 text-sm font-medium">${property.price.toLocaleString()}</td>
                    <td className="py-2 px-2 text-sm">{property.bedrooms}/{property.bathrooms}</td>
                    <td className="py-2 px-2 text-sm">{property.soldDate}</td>
                    <td className="py-2 px-2 text-sm">{property.daysOnMarket}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Template Sections Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">
            Report Sections - {templates.find(t => t.id === selectedTemplate)?.name}
          </h2>
          <div className="space-y-3">
            {templates.find(t => t.id === selectedTemplate)?.sections.map((section, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 bg-[#636B56] text-white rounded-full flex items-center justify-center text-sm">
                    {index + 1}
                  </span>
                  <span className="font-medium">{section}</span>
                </div>
                <span className="text-sm text-gray-600">Included</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <button className="px-6 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors">
            Save Draft
          </button>
          <button className="px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors">
            Preview Report
          </button>
          <button 
            onClick={generateCMA}
            className="px-6 py-2 bg-gradient-to-r from-[#636B56] to-[#864936] text-white rounded-lg hover:shadow-lg transition-all"
          >
            Generate & Send
          </button>
        </div>
      </div>
    </Layout>
  );
}