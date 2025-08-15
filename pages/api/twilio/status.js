// Handle call status callbacks from Twilio
export default async function handler(req, res) {
  try {
    const {
      CallSid,
      CallStatus,
      From,
      To,
      Direction,
      Duration,
      ContactId
    } = req.body;

    console.log('Call status update:', {
      CallSid,
      CallStatus,
      From,
      To,
      Direction,
      Duration: Duration ? `${Duration}s` : 'N/A',
      ContactId
    });

    // Here you could save call records to your database
    // For now, we'll just log the status
    
    switch (CallStatus) {
      case 'ringing':
        console.log(`📞 Call ${CallSid} is ringing`);
        break;
      case 'answered':
        console.log(`✅ Call ${CallSid} answered`);
        break;
      case 'completed':
        console.log(`🏁 Call ${CallSid} completed (Duration: ${Duration}s)`);
        break;
      case 'busy':
        console.log(`📵 Call ${CallSid} was busy`);
        break;
      case 'no-answer':
        console.log(`📴 Call ${CallSid} - no answer`);
        break;
      case 'canceled':
        console.log(`❌ Call ${CallSid} canceled`);
        break;
      case 'failed':
        console.log(`⚠️ Call ${CallSid} failed`);
        break;
      default:
        console.log(`ℹ️ Call ${CallSid} status: ${CallStatus}`);
    }

    // Always respond with 200 OK to acknowledge receipt
    res.status(200).json({ received: true });
    
  } catch (error) {
    console.error('Error processing status callback:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}