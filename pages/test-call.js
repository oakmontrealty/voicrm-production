import { useState } from 'react';
import SimpleBrowserPhone from '../components/voice/SimpleBrowserPhone';

export default function TestCall() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [calling, setCalling] = useState(false);
  const [status, setStatus] = useState('Ready to call');

  const handleCall = () => {
    if (!phoneNumber) {
      setStatus('Please enter a phone number');
      return;
    }

    // Format Australian number if needed
    let formattedNumber = phoneNumber.replace(/\s/g, '');
    if (formattedNumber.startsWith('04')) {
      formattedNumber = '+61' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('4')) {
      formattedNumber = '+61' + formattedNumber;
    } else if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }

    const testContact = {
      name: 'Test Call',
      phone: formattedNumber,
      email: 'test@voicrm.com'
    };

    setCalling(true);
    setStatus(`Calling ${formattedNumber}...`);
  };

  const handleEndCall = () => {
    setCalling(false);
    setStatus('Call ended');
    setTimeout(() => setStatus('Ready to call'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-full mb-4">
            <svg className="h-10 w-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Test Your VoiCRM Call</h1>
          <p className="mt-2 text-gray-600">Two-way audio with noise suppression</p>
        </div>

        {!calling ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter number (e.g., 0412345678)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyPress={(e) => e.key === 'Enter' && handleCall()}
              />
              <p className="mt-1 text-xs text-gray-500">
                Australian mobile: 04XX XXX XXX
              </p>
            </div>

            <button
              onClick={handleCall}
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>Start Call</span>
            </button>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 font-medium mb-2">How it works:</p>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Audio comes through your browser (computer speakers)</li>
                <li>• Speak into your computer microphone</li>
                <li>• Professional noise suppression removes all background noise</li>
                <li>• Call is recorded and transcribed automatically</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4 animate-pulse">
                <svg className="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <p className="text-lg font-medium text-gray-900">{status}</p>
              <p className="text-sm text-gray-500 mt-1">Call in progress...</p>
            </div>

            <button
              onClick={handleEndCall}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center space-x-2 transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M3.5 3.5A.5.5 0 014 3h2.153a.5.5 0 01.493.418l1.187 7.121a.5.5 0 01-.27.53l-2.194 1.097a12.037 12.037 0 006.642 6.642l1.097-2.194a.5.5 0 01.53-.27l7.121 1.187a.5.5 0 01.418.493V20a.5.5 0 01-.5.5h-2C9.716 20.5 3.5 14.284 3.5 6V3.5zM19.97 4.97a.75.75 0 011.06 0l2 2a.75.75 0 11-1.06 1.06L20 6.06l-1.97 1.97a.75.75 0 11-1.06-1.06l1.97-1.97-1.97-1.97a.75.75 0 010-1.06z" clipRule="evenodd" />
              </svg>
              <span>End Call</span>
            </button>

            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-xs text-green-800">
                ✓ Noise suppression active<br />
                ✓ HD audio quality<br />
                ✓ Recording enabled<br />
                ✓ AI transcription running
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-center text-sm text-gray-500">
            Status: <span className="font-medium text-gray-700">{status}</span>
          </p>
        </div>
      </div>

      {calling && (
        <SimpleBrowserPhone
          contact={{
            name: 'Test Call',
            phone: phoneNumber.replace(/\s/g, '').startsWith('+') ? phoneNumber : '+' + phoneNumber,
            email: 'test@voicrm.com'
          }}
          onCallEnd={handleEndCall}
        />
      )}
    </div>
  );
}