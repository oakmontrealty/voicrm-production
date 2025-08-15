import { useState, useEffect } from 'react';
import { PhoneIcon, BackspaceIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { MicrophoneIcon, SpeakerWaveIcon, VideoCameraIcon, PauseIcon } from '@heroicons/react/24/outline';

export default function Dialpad({ onCall, isInCall = false, onEndCall }) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  useEffect(() => {
    let interval;
    if (isInCall && !isOnHold) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isInCall, isOnHold]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDialpadPress = (digit) => {
    setPhoneNumber(prev => prev + digit);
    // Play DTMF tone
    playDTMF(digit);
  };

  const playDTMF = (digit) => {
    // Create audio context for DTMF tones
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // DTMF frequencies
    const frequencies = {
      '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
      '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
      '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
      '*': [941, 1209], '0': [941, 1336], '#': [941, 1477]
    };

    if (frequencies[digit]) {
      oscillator1.frequency.value = frequencies[digit][0];
      oscillator2.frequency.value = frequencies[digit][1];

      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(audioContext.destination);

      gainNode.gain.value = 0.3;
      oscillator1.start();
      oscillator2.start();

      setTimeout(() => {
        oscillator1.stop();
        oscillator2.stop();
        audioContext.close();
      }, 200);
    }
  };

  const handleBackspace = () => {
    setPhoneNumber(prev => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (phoneNumber.length >= 3) {
      onCall(phoneNumber);
      setCallDuration(0);
    }
  };

  const handleEndCall = () => {
    onEndCall();
    setCallDuration(0);
    setIsMuted(false);
    setIsSpeakerOn(false);
    setIsOnHold(false);
  };

  const formatPhoneNumber = (number) => {
    // Format as Australian number: +61 X XXXX XXXX
    if (number.startsWith('+61')) {
      const cleaned = number.replace(/\D/g, '');
      const match = cleaned.match(/^61(\d{1})(\d{4})(\d{4})$/);
      if (match) {
        return `+61 ${match[1]} ${match[2]} ${match[3]}`;
      }
    }
    // Format as US number: (XXX) XXX-XXXX
    const cleaned = number.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{1,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      if (match[2]) {
        return match[3] ? `(${match[1]}) ${match[2]}-${match[3]}` : `(${match[1]}) ${match[2]}`;
      }
      return match[1];
    }
    return number;
  };

  const dialpadButtons = [
    { digit: '1', letters: '' },
    { digit: '2', letters: 'ABC' },
    { digit: '3', letters: 'DEF' },
    { digit: '4', letters: 'GHI' },
    { digit: '5', letters: 'JKL' },
    { digit: '6', letters: 'MNO' },
    { digit: '7', letters: 'PQRS' },
    { digit: '8', letters: 'TUV' },
    { digit: '9', letters: 'WXYZ' },
    { digit: '*', letters: '' },
    { digit: '0', letters: '+' },
    { digit: '#', letters: '' }
  ];

  return (
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#636B56] to-[#864936] p-4 text-white">
        <div className="text-center">
          <h2 className="text-lg font-semibold">VoiCRM Phone</h2>
          {isInCall && (
            <div className="mt-2">
              <p className="text-sm opacity-90">
                {isOnHold ? 'On Hold' : 'Connected'}
              </p>
              <p className="text-2xl font-mono mt-1">{formatDuration(callDuration)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Display */}
      <div className="p-6 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <input
            type="tel"
            value={formatPhoneNumber(phoneNumber)}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter number"
            className="text-2xl font-light text-gray-800 bg-transparent outline-none flex-1"
            readOnly={isInCall}
          />
          {phoneNumber && !isInCall && (
            <button
              onClick={handleBackspace}
              className="p-2 hover:bg-gray-200 rounded-full transition-colors"
            >
              <BackspaceIcon className="h-5 w-5 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* In-call controls */}
      {isInCall && (
        <div className="p-4 bg-gray-100 border-b">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center ${
                isMuted ? 'bg-red-500 text-white' : 'bg-white hover:bg-gray-200'
              }`}
            >
              <MicrophoneIcon className="h-5 w-5" />
              <span className="text-[10px] mt-1 leading-none">
                {isMuted ? 'Unmute' : 'Mute'}
              </span>
            </button>
            
            <button
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center ${
                isSpeakerOn ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-200'
              }`}
            >
              <SpeakerWaveIcon className="h-5 w-5" />
              <span className="text-[10px] mt-1 leading-none">Speaker</span>
            </button>
            
            <button
              onClick={() => setIsOnHold(!isOnHold)}
              className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center ${
                isOnHold ? 'bg-yellow-500 text-white' : 'bg-white hover:bg-gray-200'
              }`}
            >
              <PauseIcon className="h-5 w-5" />
              <span className="text-[10px] mt-1 leading-none">
                {isOnHold ? 'Resume' : 'Hold'}
              </span>
            </button>
            
            <button
              className="p-3 bg-white rounded-lg hover:bg-gray-200 transition-colors flex flex-col items-center justify-center"
            >
              <VideoCameraIcon className="h-5 w-5" />
              <span className="text-[10px] mt-1 leading-none">Add</span>
            </button>
          </div>
        </div>
      )}

      {/* Dialpad */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2">
          {dialpadButtons.map((button) => (
            <button
              key={button.digit}
              onClick={() => handleDialpadPress(button.digit)}
              className="relative h-16 rounded-full bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-all transform active:scale-95 flex flex-col items-center justify-center"
            >
              <span className="text-2xl font-light text-gray-800 leading-none">
                {button.digit}
              </span>
              {button.letters && (
                <span className="text-[10px] text-gray-500 font-medium mt-1 leading-none">
                  {button.letters}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Call button */}
      <div className="p-4 bg-gray-50">
        {!isInCall ? (
          <button
            onClick={handleCall}
            disabled={phoneNumber.length < 3}
            className={`w-full py-4 rounded-full flex items-center justify-center transition-all transform active:scale-95 ${
              phoneNumber.length >= 3
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <PhoneIcon className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">Call</span>
          </button>
        ) : (
          <button
            onClick={handleEndCall}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all transform active:scale-95"
          >
            <XMarkIcon className="h-6 w-6 mr-2" />
            <span className="text-lg font-medium">End Call</span>
          </button>
        )}
      </div>

      {/* Quick dial */}
      <div className="p-4 border-t bg-white">
        <p className="text-xs text-gray-500 mb-2">Recent Calls</p>
        <div className="space-y-1">
          <button
            onClick={() => setPhoneNumber('+61456789012')}
            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm"
          >
            <span className="font-medium">John Smith</span>
            <span className="text-gray-500 ml-2">+61 4 5678 9012</span>
          </button>
          <button
            onClick={() => setPhoneNumber('+61456789013')}
            className="w-full text-left p-2 hover:bg-gray-50 rounded-lg text-sm"
          >
            <span className="font-medium">Sarah Wilson</span>
            <span className="text-gray-500 ml-2">+61 4 5678 9013</span>
          </button>
        </div>
      </div>
    </div>
  );
}