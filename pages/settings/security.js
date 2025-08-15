import { useState } from 'react';
import Layout from '../../components/Layout';

export default function SecuritySettings() {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);

  const handleEnable2FA = () => {
    setShowQRCode(true);
  };

  const handleConfirm2FA = () => {
    setTwoFactorEnabled(true);
    setShowQRCode(false);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Security Settings
          </h1>
          <p className="text-[#7a7a7a] mt-2">Manage your account security and access controls</p>
        </div>

        {/* Two-Factor Authentication */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-[#636B56]">Two-Factor Authentication (2FA)</h2>
              <p className="text-sm text-gray-600 mt-1">Add an extra layer of security to your account</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm ${
              twoFactorEnabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {twoFactorEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>

          {!twoFactorEnabled && !showQRCode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800">
                ⚠️ Two-factor authentication is not enabled. We strongly recommend enabling it for better security.
              </p>
            </div>
          )}

          {showQRCode && (
            <div className="border rounded-lg p-6 mb-4">
              <h3 className="font-medium mb-4">Scan QR Code with Authenticator App</h3>
              <div className="flex flex-col md:flex-row gap-6">
                <div className="bg-gray-100 rounded-lg p-4 w-48 h-48 flex items-center justify-center">
                  {/* QR Code Placeholder */}
                  <div className="text-center">
                    <div className="text-6xl mb-2">📱</div>
                    <p className="text-xs text-gray-600">QR Code</p>
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-3">
                    1. Install an authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <p className="text-sm text-gray-600 mb-3">
                    2. Scan the QR code with your authenticator app
                  </p>
                  <p className="text-sm text-gray-600 mb-4">
                    3. Enter the 6-digit code from your app below
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="000000"
                      maxLength="6"
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                    />
                    <button
                      onClick={handleConfirm2FA}
                      className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
                    >
                      Verify & Enable
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!twoFactorEnabled && !showQRCode && (
            <button
              onClick={handleEnable2FA}
              className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors"
            >
              Enable Two-Factor Authentication
            </button>
          )}

          {twoFactorEnabled && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ Two-factor authentication is active and protecting your account
                </p>
              </div>
              <div className="flex gap-2">
                <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                  View Backup Codes
                </button>
                <button className="border border-red-300 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">
                  Disable 2FA
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Login Activity */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Recent Login Activity</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Current Session</p>
                <p className="text-sm text-gray-600">Chrome on Windows • Sydney, AU</p>
              </div>
              <span className="text-sm text-green-600">Active now</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Mobile App</p>
                <p className="text-sm text-gray-600">iPhone • Melbourne, AU</p>
              </div>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b">
              <div>
                <p className="font-medium">Safari Browser</p>
                <p className="text-sm text-gray-600">MacBook Pro • Sydney, AU</p>
              </div>
              <span className="text-sm text-gray-500">Yesterday</span>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Security Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Require password change</p>
                <p className="text-sm text-gray-600">Force password change every 90 days</p>
              </div>
              <input type="checkbox" className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Login notifications</p>
                <p className="text-sm text-gray-600">Get notified of new login attempts</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Session timeout</p>
                <p className="text-sm text-gray-600">Auto logout after 30 minutes of inactivity</p>
              </div>
              <input type="checkbox" defaultChecked className="toggle" />
            </label>
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">IP restriction</p>
                <p className="text-sm text-gray-600">Only allow login from trusted IP addresses</p>
              </div>
              <input type="checkbox" className="toggle" />
            </label>
          </div>
        </div>

        {/* Password Management */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Password Management</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Last changed: 45 days ago</p>
              <button className="bg-[#636B56] text-white px-4 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
                Change Password
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}