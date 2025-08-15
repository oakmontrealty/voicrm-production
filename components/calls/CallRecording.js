import { useState, useEffect, useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowDownTrayIcon, DocumentTextIcon } from '@heroicons/react/24/solid';
import WaveSurfer from 'wavesurfer.js';

export default function CallRecording({ callId, callData }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [loading, setLoading] = useState(true);
  const [transcription, setTranscription] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);

  useEffect(() => {
    if (callData?.recordingUrl) {
      initializeWaveform();
      loadTranscription();
    }
    
    return () => {
      if (wavesurfer.current) {
        wavesurfer.current.destroy();
      }
    };
  }, [callData]);

  const initializeWaveform = () => {
    wavesurfer.current = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#6366f1',
      progressColor: '#4f46e5',
      cursorColor: '#4f46e5',
      barWidth: 2,
      barRadius: 3,
      responsive: true,
      height: 60,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurfer.current.load(callData.recordingUrl);

    wavesurfer.current.on('ready', () => {
      setLoading(false);
      setDuration(wavesurfer.current.getDuration());
    });

    wavesurfer.current.on('audioprocess', () => {
      setCurrentTime(wavesurfer.current.getCurrentTime());
    });

    wavesurfer.current.on('play', () => setIsPlaying(true));
    wavesurfer.current.on('pause', () => setIsPlaying(false));
    wavesurfer.current.on('finish', () => setIsPlaying(false));
  };

  const loadTranscription = async () => {
    try {
      const response = await fetch(`/api/calls/transcribe/${callId}`);
      const data = await response.json();
      setTranscription(data.transcription);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Error loading transcription:', error);
    }
  };

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const downloadRecording = () => {
    const link = document.createElement('a');
    link.href = callData.recordingUrl;
    link.download = `call-recording-${callId}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const exportTranscript = () => {
    if (!transcription) return;
    
    const content = `Call Recording Transcript
Date: ${new Date(callData.timestamp).toLocaleString()}
Participants: ${callData.from} - ${callData.to}
Duration: ${formatTime(duration)}

TRANSCRIPT:
${transcription.text}

ANALYSIS:
Summary: ${analysis?.summary || 'N/A'}
Sentiment: ${analysis?.sentiment || 'N/A'}
Key Points: ${analysis?.keyPoints?.join(', ') || 'N/A'}
Action Items: ${analysis?.actionItems?.join(', ') || 'N/A'}
Lead Score: ${analysis?.leadScore || 'N/A'}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `transcript-${callId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Call Recording</h3>
        <p className="text-sm text-gray-500">
          {new Date(callData.timestamp).toLocaleString()} • {callData.from} → {callData.to}
        </p>
      </div>

      {/* Waveform */}
      <div className="mb-4">
        {loading && (
          <div className="h-16 flex items-center justify-center bg-gray-100 rounded">
            <p className="text-sm text-gray-500">Loading audio waveform...</p>
          </div>
        )}
        <div ref={waveformRef} className={loading ? 'hidden' : ''} />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={togglePlayPause}
            disabled={loading}
            className="p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50"
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </button>
          <div className="text-sm text-gray-600">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Toggle transcript"
          >
            <DocumentTextIcon className="h-5 w-5" />
          </button>
          <button
            onClick={downloadRecording}
            className="p-2 text-gray-600 hover:text-gray-900"
            title="Download recording"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-sm mb-2">AI Analysis</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Sentiment:</span>{' '}
              <span className={`px-2 py-1 rounded text-xs ${
                analysis.sentiment === 'Positive' ? 'bg-green-100 text-green-800' :
                analysis.sentiment === 'Negative' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {analysis.sentiment}
              </span>
            </div>
            <div>
              <span className="font-medium">Lead Score:</span>{' '}
              <span className="text-indigo-600 font-semibold">{analysis.leadScore}/100</span>
            </div>
            <div>
              <span className="font-medium">Summary:</span> {analysis.summary}
            </div>
            {analysis.actionItems?.length > 0 && (
              <div>
                <span className="font-medium">Action Items:</span>
                <ul className="mt-1 ml-4 list-disc">
                  {analysis.actionItems.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Transcript */}
      {showTranscript && transcription && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold">Transcript</h4>
            <button
              onClick={exportTranscript}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              Export
            </button>
          </div>
          <div className="max-h-64 overflow-y-auto bg-gray-50 rounded p-3">
            {transcription.segments ? (
              <div className="space-y-2">
                {transcription.segments.map((segment, idx) => (
                  <div key={idx} className="text-sm">
                    <span className="text-gray-500">[{formatTime(segment.start)}]</span>{' '}
                    <span className="font-medium">{segment.speaker}:</span>{' '}
                    <span>{segment.text}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-700">{transcription.text}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}