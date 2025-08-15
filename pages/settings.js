import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

export default function Settings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: user?.email || 'john.doe@oakmontrealty.com',
    phone: '(555) 123-4567',
    role: 'Senior Agent',
    department: 'Residential Sales',
  });

  const [notifications, setNotifications] = useState({
    emailNewLead: true,
    emailDealClosed: true,
    smsAppointment: false,
    pushUpdates: true,
  });

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (key) => {
    setNotifications({
      ...notifications,
      [key]: !notifications[key],
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>Settings</h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Profile Information</h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                name="role"
                value={profile.role}
                onChange={handleProfileChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="mt-6">
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email for new leads</p>
                <p className="text-sm text-gray-500">Get notified when a new lead is assigned</p>
              </div>
              <button
                onClick={() => handleNotificationChange('emailNewLead')}
                className={`${
                  notifications.emailNewLead ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    notifications.emailNewLead ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email for closed deals</p>
                <p className="text-sm text-gray-500">Celebrate when a deal is closed</p>
              </div>
              <button
                onClick={() => handleNotificationChange('emailDealClosed')}
                className={`${
                  notifications.emailDealClosed ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    notifications.emailDealClosed ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">SMS for appointments</p>
                <p className="text-sm text-gray-500">Get text reminders for upcoming appointments</p>
              </div>
              <button
                onClick={() => handleNotificationChange('smsAppointment')}
                className={`${
                  notifications.smsAppointment ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    notifications.smsAppointment ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Push notifications</p>
                <p className="text-sm text-gray-500">Get real-time updates in your browser</p>
              </div>
              <button
                onClick={() => handleNotificationChange('pushUpdates')}
                className={`${
                  notifications.pushUpdates ? 'bg-indigo-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
              >
                <span
                  className={`${
                    notifications.pushUpdates ? 'translate-x-5' : 'translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Twilio Phone Configuration */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Phone System Configuration</h3>
          
          {/* Status Indicators */}
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Twilio Connected Successfully</span>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Your phone system is active and ready to make calls.
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value="+61482080888"
                  disabled
                  className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm"
                />
                <span className="text-xs text-green-600">Active</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Account Status</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="text"
                  value="Connected"
                  disabled
                  className="block w-full border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-600 sm:text-sm"
                />
                <span className="text-xs text-green-600">Verified</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Call Quality</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#636B56] focus:border-[#636B56] sm:text-sm">
                <option>HD Voice (Recommended)</option>
                <option>Standard</option>
                <option>Economy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Noise Suppression</label>
              <select className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#636B56] focus:border-[#636B56] sm:text-sm">
                <option>Enabled (Default)</option>
                <option>Disabled</option>
              </select>
            </div>
          </div>

          <div className="mt-6 border-t pt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="call-recording"
                  defaultChecked
                  className="h-4 w-4 text-[#636B56] focus:ring-[#636B56] border-gray-300 rounded"
                />
                <label htmlFor="call-recording" className="ml-2 text-sm text-gray-700">
                  Enable call recording
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="voicemail"
                  defaultChecked
                  className="h-4 w-4 text-[#636B56] focus:ring-[#636B56] border-gray-300 rounded"
                />
                <label htmlFor="voicemail" className="ml-2 text-sm text-gray-700">
                  Enable voicemail
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="echo-cancellation"
                  defaultChecked
                  className="h-4 w-4 text-[#636B56] focus:ring-[#636B56] border-gray-300 rounded"
                />
                <label htmlFor="echo-cancellation" className="ml-2 text-sm text-gray-700">
                  Enable echo cancellation
                </label>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <button className="px-4 py-2 bg-[#636B56] text-white rounded-md hover:bg-[#525a48]">
              Save Phone Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</Layout>
  );
}