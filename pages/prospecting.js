import { useState } from 'react';
import Layout from '../components/Layout';

export default function Prospecting() {
  const [prospectLists] = useState([
    { id: 1, name: 'Hot Leads - Western Sydney', count: 234, quality: 92 },
    { id: 2, name: 'First Home Buyers', count: 156, quality: 78 },
    { id: 3, name: 'Investment Properties', count: 89, quality: 85 },
    { id: 4, name: 'Luxury Market', count: 45, quality: 95 }
  ]);

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Prospecting
              </h1>
              <p className="text-[#7a7a7a] mt-2">AI-powered lead generation and prospecting tools</p>
            </div>
            <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
              Generate Leads
            </button>
          </div>
        </div>

        {/* AI Prospecting Stats */}
        <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl shadow-sm p-6 text-white">
          <h2 className="text-xl font-semibold mb-4">AI Prospecting Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-3xl font-bold">524</p>
              <p className="text-sm opacity-90">Prospects Identified</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-3xl font-bold">87%</p>
              <p className="text-sm opacity-90">Match Score</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-3xl font-bold">156</p>
              <p className="text-sm opacity-90">Ready to Contact</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-3xl font-bold">23</p>
              <p className="text-sm opacity-90">Hot Leads Today</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Prospect Lists */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Prospect Lists</h2>
            <div className="space-y-3">
              {prospectLists.map(list => (
                <div key={list.id} className="border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{list.name}</p>
                      <p className="text-sm text-gray-600">{list.count} prospects</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Quality</div>
                      <div className="flex items-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${list.quality}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">{list.quality}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lead Sources */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-[#636B56] mb-4">Lead Sources</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-blue-500 rounded-full mr-3"></span>
                  <span>Website Forms</span>
                </div>
                <span className="font-medium">234</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-green-500 rounded-full mr-3"></span>
                  <span>Social Media</span>
                </div>
                <span className="font-medium">189</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-purple-500 rounded-full mr-3"></span>
                  <span>Referrals</span>
                </div>
                <span className="font-medium">145</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></span>
                  <span>Cold Outreach</span>
                </div>
                <span className="font-medium">98</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-3 h-3 bg-red-500 rounded-full mr-3"></span>
                  <span>Open Houses</span>
                </div>
                <span className="font-medium">76</span>
              </div>
            </div>
          </div>
        </div>

        {/* Prospecting Tools */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Prospecting Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">🔍 Lead Finder</h3>
              <p className="text-sm text-gray-600">Search and discover new prospects based on criteria</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">📊 Lead Scoring</h3>
              <p className="text-sm text-gray-600">AI-powered lead qualification and scoring</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">🎯 Audience Builder</h3>
              <p className="text-sm text-gray-600">Create targeted prospect lists for campaigns</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">📧 Email Finder</h3>
              <p className="text-sm text-gray-600">Find and verify prospect email addresses</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">🌐 Social Prospecting</h3>
              <p className="text-sm text-gray-600">Find leads from social media platforms</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer">
              <h3 className="font-medium mb-2">📱 Contact Enrichment</h3>
              <p className="text-sm text-gray-600">Enhance prospect data with additional information</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}