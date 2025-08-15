import { useState } from 'react';
import Layout from '../../components/Layout';

export default function CompanySettings() {
  const [companyInfo, setCompanyInfo] = useState({
    name: 'VoiCRM Real Estate',
    address: '123 Business Avenue, Suite 200',
    city: 'Downtown',
    state: 'CA',
    zipCode: '12345',
    phone: '(555) 123-4567',
    email: 'info@voicrm.com',
    website: 'www.voicrm.com',
    license: 'RE-2025-12345',
    taxId: '12-3456789'
  });

  const [branding, setBranding] = useState({
    logo: null,
    primaryColor: '#636B56',
    secondaryColor: '#864936',
    accentColor: '#B28354',
    companySlogan: 'Your Trusted Real Estate Partner'
  });

  const [businessSettings, setBusinessSettings] = useState({
    timezone: 'Pacific/Los_Angeles',
    businessHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '18:00', closed: false },
      saturday: { open: '10:00', close: '16:00', closed: false },
      sunday: { open: '12:00', close: '16:00', closed: true }
    },
    defaultCommissionRate: 6.0,
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY'
  });

  const handleCompanyInfoChange = (field, value) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleBrandingChange = (field, value) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessSettingChange = (field, value) => {
    setBusinessSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleBusinessHoursChange = (day, field, value) => {
    setBusinessSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSave = () => {
    // Save company settings
    console.log('Saving company settings:', { companyInfo, branding, businessSettings });
    alert('Company settings saved successfully!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Company Settings
          </h1>
          <p className="text-[#7a7a7a] mt-2">Manage your company information, branding, and business settings</p>
        </div>

        {/* Company Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Company Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                value={companyInfo.name}
                onChange={(e) => handleCompanyInfoChange('name', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Real Estate License</label>
              <input
                type="text"
                value={companyInfo.license}
                onChange={(e) => handleCompanyInfoChange('license', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <input
                type="text"
                value={companyInfo.address}
                onChange={(e) => handleCompanyInfoChange('address', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                value={companyInfo.city}
                onChange={(e) => handleCompanyInfoChange('city', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <select
                  value={companyInfo.state}
                  onChange={(e) => handleCompanyInfoChange('state', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                >
                  <option value="CA">California</option>
                  <option value="NY">New York</option>
                  <option value="TX">Texas</option>
                  <option value="FL">Florida</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
                <input
                  type="text"
                  value={companyInfo.zipCode}
                  onChange={(e) => handleCompanyInfoChange('zipCode', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="tel"
                value={companyInfo.phone}
                onChange={(e) => handleCompanyInfoChange('phone', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={companyInfo.email}
                onChange={(e) => handleCompanyInfoChange('email', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <input
                type="url"
                value={companyInfo.website}
                onChange={(e) => handleCompanyInfoChange('website', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax ID</label>
              <input
                type="text"
                value={companyInfo.taxId}
                onChange={(e) => handleCompanyInfoChange('taxId', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Branding & Visual Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="text-gray-400 mb-2">
                  <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-gray-600">Click to upload logo</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 2MB</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Slogan</label>
              <input
                type="text"
                value={branding.companySlogan}
                onChange={(e) => handleBrandingChange('companySlogan', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="Enter your company slogan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="w-12 h-12 border rounded-lg"
                />
                <input
                  type="text"
                  value={branding.primaryColor}
                  onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Secondary Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 border rounded-lg"
                />
                <input
                  type="text"
                  value={branding.secondaryColor}
                  onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex gap-3">
                <input
                  type="color"
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  className="w-12 h-12 border rounded-lg"
                />
                <input
                  type="text"
                  value={branding.accentColor}
                  onChange={(e) => handleBrandingChange('accentColor', e.target.value)}
                  className="flex-1 p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Business Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={businessSettings.timezone}
                onChange={(e) => handleBusinessSettingChange('timezone', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="Pacific/Los_Angeles">Pacific Time (PST/PDT)</option>
                <option value="America/New_York">Eastern Time (EST/EDT)</option>
                <option value="America/Chicago">Central Time (CST/CDT)</option>
                <option value="America/Denver">Mountain Time (MST/MDT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={businessSettings.currency}
                onChange={(e) => handleBusinessSettingChange('currency', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={businessSettings.dateFormat}
                onChange={(e) => handleBusinessSettingChange('dateFormat', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Default Commission Rate (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={businessSettings.defaultCommissionRate}
                onChange={(e) => handleBusinessSettingChange('defaultCommissionRate', parseFloat(e.target.value))}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              />
            </div>
          </div>

          {/* Business Hours */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-4">Business Hours</h3>
            <div className="space-y-3">
              {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
                <div key={day} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="w-20">
                    <span className="font-medium capitalize">{day}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={!hours.closed}
                      onChange={(e) => handleBusinessHoursChange(day, 'closed', !e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Open</span>
                  </div>
                  {!hours.closed && (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">From:</span>
                        <input
                          type="time"
                          value={hours.open}
                          onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                          className="p-2 border rounded focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">To:</span>
                        <input
                          type="time"
                          value={hours.close}
                          onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                          className="p-2 border rounded focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                        />
                      </div>
                    </>
                  )}
                  {hours.closed && (
                    <span className="text-sm text-gray-500 italic">Closed</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-end gap-3">
            <button className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 bg-[#636B56] text-white rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}