import { useState } from 'react';
import Layout from '../../components/Layout';

export default function ProfileSettings() {
  const [personalInfo, setPersonalInfo] = useState({
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@voicrm.com',
    phone: '(555) 123-4567',
    title: 'Senior Real Estate Agent',
    bio: 'Experienced real estate professional with over 10 years in the industry, specializing in residential properties and first-time home buyers.',
    avatar: null
  });

  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'Pacific/Los_Angeles',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12',
    currency: 'USD',
    theme: 'light'
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    newLeads: true,
    taskReminders: true,
    appointmentReminders: true,
    dealUpdates: true,
    marketingUpdates: false,
    systemUpdates: true
  });

  const [socialProfiles, setSocialProfiles] = useState({
    linkedin: 'https://linkedin.com/in/johnsmith',
    facebook: '',
    twitter: '',
    instagram: '',
    website: 'https://johnsmith-realestate.com'
  });

  const handlePersonalInfoChange = (field, value) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handlePreferenceChange = (field, value) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field, value) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleSocialProfileChange = (field, value) => {
    setSocialProfiles(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    console.log('Saving profile:', { personalInfo, preferences, notifications, socialProfiles });
    alert('Profile settings saved successfully!');
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Profile Settings
          </h1>
          <p className="text-[#7a7a7a] mt-2">Manage your personal information and preferences</p>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Profile Picture */}
            <div className="md:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
              <div className="flex flex-col items-center">
                <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                  {personalInfo.avatar ? (
                    <img src={personalInfo.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-4xl text-gray-400">👤</span>
                  )}
                </div>
                <button className="px-4 py-2 border border-[#636B56] text-[#636B56] rounded-lg hover:bg-[#636B56] hover:text-white transition-colors">
                  Change Picture
                </button>
              </div>
            </div>

            {/* Personal Details */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                <input
                  type="text"
                  value={personalInfo.firstName}
                  onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                <input
                  type="text"
                  value={personalInfo.lastName}
                  onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input
                  type="text"
                  value={personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                <textarea
                  rows={4}
                  value={personalInfo.bio}
                  onChange={(e) => handlePersonalInfoChange('bio', e.target.value)}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                  placeholder="Tell us about your experience and specialties..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => handlePreferenceChange('language', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="Pacific/Los_Angeles">Pacific Time (PST/PDT)</option>
                <option value="America/New_York">Eastern Time (EST/EDT)</option>
                <option value="America/Chicago">Central Time (CST/CDT)</option>
                <option value="America/Denver">Mountain Time (MST/MDT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
              <select
                value={preferences.dateFormat}
                onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Time Format</label>
              <select
                value={preferences.timeFormat}
                onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="12">12-hour (AM/PM)</option>
                <option value="24">24-hour</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                value={preferences.currency}
                onChange={(e) => handlePreferenceChange('currency', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Notification Settings</h2>
          
          {/* General Notification Methods */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-700 mb-3">Notification Methods</h3>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) => handleNotificationChange('emailNotifications', e.target.checked)}
                  className="rounded mr-3"
                />
                <span>Email Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={(e) => handleNotificationChange('smsNotifications', e.target.checked)}
                  className="rounded mr-3"
                />
                <span>SMS Notifications</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                  className="rounded mr-3"
                />
                <span>Push Notifications</span>
              </label>
            </div>
          </div>

          {/* Specific Notifications */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Notification Types</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.newLeads}
                  onChange={(e) => handleNotificationChange('newLeads', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">New Leads</span>
                  <p className="text-sm text-gray-600">When new leads are assigned to you</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.taskReminders}
                  onChange={(e) => handleNotificationChange('taskReminders', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">Task Reminders</span>
                  <p className="text-sm text-gray-600">Reminders for upcoming tasks</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.appointmentReminders}
                  onChange={(e) => handleNotificationChange('appointmentReminders', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">Appointment Reminders</span>
                  <p className="text-sm text-gray-600">Reminders for upcoming appointments</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.dealUpdates}
                  onChange={(e) => handleNotificationChange('dealUpdates', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">Deal Updates</span>
                  <p className="text-sm text-gray-600">Updates on deal progress and changes</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.marketingUpdates}
                  onChange={(e) => handleNotificationChange('marketingUpdates', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">Marketing Updates</span>
                  <p className="text-sm text-gray-600">Marketing tips and campaign results</p>
                </div>
              </label>
              
              <label className="flex items-center p-3 border rounded-lg">
                <input
                  type="checkbox"
                  checked={notifications.systemUpdates}
                  onChange={(e) => handleNotificationChange('systemUpdates', e.target.checked)}
                  className="rounded mr-3"
                />
                <div>
                  <span className="font-medium">System Updates</span>
                  <p className="text-sm text-gray-600">Important system and feature updates</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Social Profiles */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Social Profiles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">LinkedIn Profile</label>
              <input
                type="url"
                value={socialProfiles.linkedin}
                onChange={(e) => handleSocialProfileChange('linkedin', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Personal Website</label>
              <input
                type="url"
                value={socialProfiles.website}
                onChange={(e) => handleSocialProfileChange('website', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="https://yourwebsite.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Facebook Page</label>
              <input
                type="url"
                value={socialProfiles.facebook}
                onChange={(e) => handleSocialProfileChange('facebook', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Instagram Profile</label>
              <input
                type="url"
                value={socialProfiles.instagram}
                onChange={(e) => handleSocialProfileChange('instagram', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Twitter Profile</label>
              <input
                type="url"
                value={socialProfiles.twitter}
                onChange={(e) => handleSocialProfileChange('twitter', e.target.value)}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
                placeholder="https://twitter.com/yourhandle"
              />
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