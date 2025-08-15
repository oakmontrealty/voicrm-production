import { useState } from 'react';
import Layout from '../components/Layout';

export default function PhoneNumbers() {
  const [carouselActive, setCarouselActive] = useState(true);
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Phone Numbers - Number Carousel
          </h1>
          <p className="text-[#7a7a7a] mt-2">Manage your phone numbers and automatic rotation system</p>
        </div>

        {/* Number Carousel Status */}
        <div className="bg-gradient-to-r from-[#636B56] to-[#864936] rounded-xl shadow-sm p-6 text-white">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Number Carousel System</h2>
            <button 
              onClick={() => setCarouselActive(!carouselActive)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                carouselActive 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {carouselActive ? '✓ Active' : 'Inactive'}
            </button>
          </div>
          <p className="text-sm opacity-90 mb-4">
            Automatically rotates through your phone numbers to prevent carrier restrictions and improve deliverability
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-2xl font-bold">5</p>
              <p className="text-sm opacity-90">Active Numbers</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-2xl font-bold">342</p>
              <p className="text-sm opacity-90">Calls Today</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-2xl font-bold">68</p>
              <p className="text-sm opacity-90">Calls Per Number</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-[#636B56]">Active Numbers</h2>
            <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
              Add Number
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">+61 2 8006 6847</p>
                  <p className="text-sm text-gray-600">Primary Business Line</p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span>
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">+61 4 1234 5678</p>
                  <p className="text-sm text-gray-600">Mobile SMS/MMS</p>
                </div>
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}