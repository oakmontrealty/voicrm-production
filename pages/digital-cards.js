import { useState } from 'react';
import Layout from '../components/Layout';
import { QrCodeIcon, ShareIcon, PencilIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function DigitalBusinessCards() {
  const [cards, setCards] = useState([
    {
      id: 1,
      name: 'Professional Card',
      title: 'Senior Real Estate Agent',
      company: 'VoiCRM Realty',
      phone: '+61 456 789 012',
      email: 'agent@voicrm.com',
      website: 'www.voicrm.com',
      address: '123 Main St, Parramatta NSW 2150',
      theme: 'gradient-professional',
      views: 342,
      shares: 89,
      lastUpdated: '2024-08-10',
      active: true
    },
    {
      id: 2,
      name: 'Luxury Properties',
      title: 'Luxury Property Specialist',
      company: 'VoiCRM Premium',
      phone: '+61 456 789 013',
      email: 'luxury@voicrm.com',
      website: 'www.voicrm-luxury.com',
      address: '456 High St, Sydney NSW 2000',
      theme: 'gradient-luxury',
      views: 128,
      shares: 34,
      lastUpdated: '2024-08-08',
      active: true
    }
  ]);

  const [showEditor, setShowEditor] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    company: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    bio: '',
    theme: 'gradient-professional'
  });

  const themes = [
    { id: 'gradient-professional', name: 'Professional', gradient: 'from-[#636B56] to-[#864936]' },
    { id: 'gradient-luxury', name: 'Luxury', gradient: 'from-[#B28354] to-[#864936]' },
    { id: 'gradient-modern', name: 'Modern', gradient: 'from-blue-600 to-purple-600' },
    { id: 'gradient-nature', name: 'Nature', gradient: 'from-green-600 to-teal-600' },
    { id: 'gradient-sunset', name: 'Sunset', gradient: 'from-orange-500 to-pink-500' },
    { id: 'gradient-ocean', name: 'Ocean', gradient: 'from-cyan-500 to-blue-500' }
  ];

  const socialPlatforms = [
    { name: 'LinkedIn', icon: '💼', url: '' },
    { name: 'Facebook', icon: '📘', url: '' },
    { name: 'Instagram', icon: '📷', url: '' },
    { name: 'Twitter', icon: '🐦', url: '' }
  ];

  const handleCreateCard = () => {
    setFormData({
      name: '',
      title: '',
      company: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      bio: '',
      theme: 'gradient-professional'
    });
    setShowEditor(true);
  };

  const handleEditCard = (card) => {
    setSelectedCard(card);
    setFormData(card);
    setShowEditor(true);
  };

  const handlePreviewCard = (card) => {
    setSelectedCard(card);
    setShowPreview(true);
  };

  const generateQRCode = (cardId) => {
    // In production, this would generate an actual QR code
    alert(`QR Code generated for card ${cardId}`);
  };

  const shareCard = (card) => {
    // In production, this would share the card via various channels
    const shareUrl = `https://voicrm.com/card/${card.id}`;
    if (navigator.share) {
      navigator.share({
        title: card.name,
        text: `Check out my digital business card`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Card link copied to clipboard!');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
                Digital Business Cards
              </h1>
              <p className="text-[#7a7a7a] mt-2">Create and share professional digital business cards</p>
            </div>
            <button 
              onClick={handleCreateCard}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              + Create New Card
            </button>
          </div>
        </div>

        {/* Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Cards</p>
            <p className="text-2xl font-bold text-[#636B56]">{cards.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Views</p>
            <p className="text-2xl font-bold text-[#636B56]">
              {cards.reduce((sum, card) => sum + card.views, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Shares</p>
            <p className="text-2xl font-bold text-[#B28354]">
              {cards.reduce((sum, card) => sum + card.shares, 0)}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Conversion Rate</p>
            <p className="text-2xl font-bold text-green-600">12.4%</p>
          </div>
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map(card => {
            const theme = themes.find(t => t.id === card.theme);
            return (
              <div key={card.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className={`h-32 bg-gradient-to-r ${theme?.gradient || 'from-gray-600 to-gray-800'}`} />
                <div className="p-6 -mt-12">
                  <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
                    {card.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-semibold">{card.name}</h3>
                  <p className="text-sm text-gray-600">{card.title}</p>
                  <p className="text-sm text-gray-600">{card.company}</p>
                  
                  <div className="mt-4 flex justify-between text-sm text-gray-500">
                    <span>👁 {card.views} views</span>
                    <span>🔗 {card.shares} shares</span>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handlePreviewCard(card)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <EyeIcon className="h-4 w-4" />
                      <span className="text-sm">Preview</span>
                    </button>
                    <button
                      onClick={() => handleEditCard(card)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="text-sm">Edit</span>
                    </button>
                    <button
                      onClick={() => shareCard(card)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                    >
                      <ShareIcon className="h-4 w-4" />
                      <span className="text-sm">Share</span>
                    </button>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => generateQRCode(card.id)}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors"
                    >
                      <QrCodeIcon className="h-4 w-4" />
                      <span className="text-sm">QR Code</span>
                    </button>
                    <button className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      {card.active ? 'Active' : 'Inactive'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Card Placeholder */}
          <div 
            onClick={handleCreateCard}
            className="bg-white rounded-xl shadow-sm p-6 border-2 border-dashed border-gray-300 hover:border-[#636B56] transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[320px]"
          >
            <div className="text-5xl mb-4">➕</div>
            <h3 className="text-lg font-semibold text-gray-600">Create New Card</h3>
            <p className="text-sm text-gray-500 text-center mt-2">
              Design a professional digital business card
            </p>
          </div>
        </div>

        {/* Card Templates */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Quick Templates</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer text-center">
              <div className="text-3xl mb-2">🏢</div>
              <p className="text-sm font-medium">Corporate</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer text-center">
              <div className="text-3xl mb-2">🎨</div>
              <p className="text-sm font-medium">Creative</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer text-center">
              <div className="text-3xl mb-2">🏠</div>
              <p className="text-sm font-medium">Real Estate</p>
            </div>
            <div className="border rounded-lg p-4 hover:border-[#636B56] transition-colors cursor-pointer text-center">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-sm font-medium">Minimal</p>
            </div>
          </div>
        </div>

        {/* Editor Modal */}
        {showEditor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-[#636B56] mb-4">
                {selectedCard ? 'Edit Card' : 'Create New Card'}
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Card Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="e.g., Professional Card"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="Senior Real Estate Agent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({...formData, company: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="VoiCRM Realty"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="+61 456 789 012"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                      placeholder="agent@voicrm.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({...formData, website: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="www.voicrm.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="123 Main St, Parramatta NSW 2150"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows="3"
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    placeholder="Brief description about yourself..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {themes.map(theme => (
                      <div
                        key={theme.id}
                        onClick={() => setFormData({...formData, theme: theme.id})}
                        className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                          formData.theme === theme.id 
                            ? 'border-[#636B56]' 
                            : 'border-gray-200 hover:border-[#B28354]'
                        }`}
                      >
                        <div className={`h-8 rounded bg-gradient-to-r ${theme.gradient} mb-2`} />
                        <p className="text-sm text-center">{theme.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Social Links</label>
                  <div className="space-y-2">
                    {socialPlatforms.map(platform => (
                      <div key={platform.name} className="flex items-center gap-2">
                        <span className="text-2xl">{platform.icon}</span>
                        <input
                          type="url"
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                          placeholder={`${platform.name} URL`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowEditor(false)}
                  className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                >
                  {selectedCard ? 'Save Changes' : 'Create Card'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && selectedCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold text-[#636B56]">Card Preview</h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <div className={`h-32 bg-gradient-to-r ${
                  themes.find(t => t.id === selectedCard.theme)?.gradient || 'from-gray-600 to-gray-800'
                }`} />
                <div className="p-6 -mt-12">
                  <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center text-3xl font-bold shadow-lg mb-4">
                    {selectedCard.name.charAt(0)}
                  </div>
                  <h3 className="text-xl font-bold">{selectedCard.name}</h3>
                  <p className="text-gray-600">{selectedCard.title}</p>
                  <p className="text-gray-600">{selectedCard.company}</p>
                  
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span>📞</span>
                      <span>{selectedCard.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>✉️</span>
                      <span>{selectedCard.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🌐</span>
                      <span>{selectedCard.website}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>📍</span>
                      <span>{selectedCard.address}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {socialPlatforms.map(platform => (
                      <button
                        key={platform.name}
                        className="text-2xl hover:scale-110 transition-transform"
                      >
                        {platform.icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-center gap-3 mt-6">
                <button
                  onClick={() => shareCard(selectedCard)}
                  className="px-4 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
                >
                  Share Card
                </button>
                <button
                  onClick={() => generateQRCode(selectedCard.id)}
                  className="px-4 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56]/5 transition-colors"
                >
                  Generate QR
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}