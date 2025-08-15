import { useState } from 'react';
import Layout from '../../components/Layout';

export default function PersonalPreferences() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'en-AU',
    timezone: 'Australia/Sydney',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '12h',
    notifications: {
      desktop: true,
      email: true,
      sms: false,
      sound: true
    },
    calling: {
      autoAnswer: false,
      ringtone: 'default',
      microphoneGain: 75,
      speakerVolume: 80,
      noiseSupression: true,
      echoCancellation: true,
      autoGainControl: true
    }
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-[#636B56]" style={{ fontFamily: 'Forum, serif' }}>
            Personal Preferences
          </h1>
          <p className="text-[#7a7a7a] mt-2">Customize your VoiCRM experience</p>
        </div>

        {/* Display Settings */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Display Settings</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select 
                value={preferences.theme}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select 
                value={preferences.language}
                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="en-AU">English (Australia)</option>
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select 
                value={preferences.timezone}
                onChange={(e) => setPreferences({...preferences, timezone: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#636B56] focus:border-transparent"
              >
                <option value="Australia/Sydney">Sydney (AEDT)</option>
                <option value="Australia/Melbourne">Melbourne (AEDT)</option>
                <option value="Australia/Brisbane">Brisbane (AEST)</option>
                <option value="Australia/Perth">Perth (AWST)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Notifications</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span>Desktop Notifications</span>
              <input 
                type="checkbox" 
                checked={preferences.notifications.desktop}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, desktop: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Email Notifications</span>
              <input 
                type="checkbox" 
                checked={preferences.notifications.email}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, email: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            <label className="flex items-center justify-between">
              <span>SMS Notifications</span>
              <input 
                type="checkbox" 
                checked={preferences.notifications.sms}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, sms: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            <label className="flex items-center justify-between">
              <span>Sound Effects</span>
              <input 
                type="checkbox" 
                checked={preferences.notifications.sound}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  notifications: {...preferences.notifications, sound: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
          </div>
        </div>

        {/* Calling Preferences */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-[#636B56] mb-4">Calling Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto-Answer Calls</p>
                <p className="text-sm text-gray-600">Automatically answer incoming calls</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.calling.autoAnswer}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, autoAnswer: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Noise Suppression</p>
                <p className="text-sm text-gray-600">AI-powered background noise removal</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.calling.noiseSupression}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, noiseSupression: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Echo Cancellation</p>
                <p className="text-sm text-gray-600">Eliminate audio echo and feedback</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.calling.echoCancellation}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, echoCancellation: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            
            <label className="flex items-center justify-between">
              <div>
                <p className="font-medium">Auto Gain Control</p>
                <p className="text-sm text-gray-600">Automatically adjust microphone levels</p>
              </div>
              <input 
                type="checkbox" 
                checked={preferences.calling.autoGainControl}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, autoGainControl: e.target.checked}
                })}
                className="toggle" 
              />
            </label>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Microphone Gain: {preferences.calling.microphoneGain}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100"
                value={preferences.calling.microphoneGain}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, microphoneGain: parseInt(e.target.value)}
                })}
                className="w-full"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speaker Volume: {preferences.calling.speakerVolume}%
              </label>
              <input 
                type="range" 
                min="0" 
                max="100"
                value={preferences.calling.speakerVolume}
                onChange={(e) => setPreferences({
                  ...preferences, 
                  calling: {...preferences.calling, speakerVolume: parseInt(e.target.value)}
                })}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button className="bg-[#636B56] text-white px-6 py-2 rounded-lg hover:bg-[#7a8365] transition-colors">
            Save Preferences
          </button>
        </div>
      </div>
    </Layout>
  );
}