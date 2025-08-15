// Handle recording callbacks from Twilio
export default async function handler(req, res) {
  try {
    const {
      CallSid,
      RecordingUrl,
      RecordingStatus,
      RecordingSid,
      RecordingDuration
    } = req.body;

    console.log('Recording callback:', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingDuration: RecordingDuration ? `${RecordingDuration}s` : 'N/A',
      RecordingUrl
    });

    if (RecordingStatus === 'completed' && RecordingUrl) {
      console.log(`🎵 Recording completed for call ${CallSid}`);
      console.log(`📁 Recording URL: ${RecordingUrl}`);
      
      // Here you could:
      // 1. Save recording details to your database
      // 2. Download and store the recording file
      // 3. Trigger transcription with OpenAI Whisper
      // 4. Send notifications about the recording
      
      // Example: Store recording info (you'd implement this based on your database)
      // await saveRecording({
      //   callSid: CallSid,
      //   recordingSid: RecordingSid,
      //   url: RecordingUrl,
      //   duration: RecordingDuration,
      //   status: RecordingStatus
      // });
    }

    // Always acknowledge receipt with 200 OK
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing recording callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}