# WhatsApp Business Integration Setup

## How WhatsApp Works in VoiCRM

WhatsApp messages work through Twilio's WhatsApp Business API. You can send and receive WhatsApp messages just like SMS, but with richer features like images, documents, and read receipts.

## Setup Steps

### 1. Enable WhatsApp in Twilio Console

1. Go to [Twilio Console](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Click "Messaging" → "Try it out" → "Send a WhatsApp message"
3. Follow the sandbox setup (for testing)

### 2. Test with Sandbox (Free)

For testing without approval:
1. Send "join <your-sandbox-word>" to **+1 415 523 8886**
2. You'll receive confirmation
3. Now you can send/receive WhatsApp messages

### 3. Production Setup (Requires Approval)

For production use:
1. Apply for WhatsApp Business Account
2. Get Facebook Business verification
3. Submit message templates for approval
4. Takes 1-2 weeks for approval

## Using WhatsApp in VoiCRM

### Send Individual WhatsApp Message
```javascript
// API endpoint: /api/twilio/whatsapp
fetch('/api/twilio/whatsapp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+61456789012',  // Customer's phone
    message: 'Hi! This is a WhatsApp message from VoiCRM'
  })
})
```

### Key Differences from SMS

| Feature | SMS | WhatsApp |
|---------|-----|----------|
| Cost | ~$0.05 AUD | ~$0.005 AUD (10x cheaper!) |
| Character Limit | 160 | 4096 |
| Images/Files | MMS only | Native support |
| Read Receipts | No | Yes |
| Typing Indicators | No | Yes |
| Group Messages | No | Yes |
| Rich Formatting | No | Yes (bold, italic, etc) |

## Message Templates

WhatsApp requires pre-approved templates for business-initiated conversations:

### Example Templates:
1. **Property Alert**
   ```
   Hi {{1}}, a new property matching your criteria is available at {{2}}. 
   View details: {{3}}
   ```

2. **Viewing Reminder**
   ```
   Hi {{1}}, reminder about your property viewing tomorrow at {{2}}. 
   Address: {{3}}
   ```

3. **Follow-up**
   ```
   Hi {{1}}, thanks for viewing {{2}} today. 
   Any questions about the property?
   ```

## Costs

- **Sandbox (Testing)**: FREE
- **Production**:
  - Business-initiated: ~$0.005 AUD per message
  - User-initiated: ~$0.003 AUD per message
  - 24-hour conversation window after user responds

## Environment Variables

Add to `.env.local`:
```env
# For testing (sandbox)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# For production (your approved number)
TWILIO_WHATSAPP_NUMBER=whatsapp:+61482080888
```

## Testing Flow

1. **Join Sandbox**: Text "join <word>" to +1 415 523 8886
2. **Test Send**: 
   ```bash
   curl -X POST http://localhost:3003/api/twilio/whatsapp \
     -H "Content-Type: application/json" \
     -d '{
       "to": "+61456789012",
       "message": "Test WhatsApp from VoiCRM"
     }'
   ```

3. **Check Messages Page**: WhatsApp messages appear in the same inbox as SMS

## UI Integration

The messages page already supports WhatsApp - just need to:
1. Add WhatsApp toggle/indicator
2. Auto-detect if number has WhatsApp
3. Show WhatsApp-specific features (typing, read receipts)

## Webhook Setup

For receiving WhatsApp messages:
1. In Twilio Console, set webhook URL to:
   ```
   https://voicrm.com/api/twilio/whatsapp
   ```
2. Method: POST
3. Messages will auto-appear in your inbox

## Benefits for Real Estate

- **10x cheaper** than SMS
- **Rich media**: Send property photos, floor plans, contracts
- **Professional**: Business verification badge
- **Global reach**: Works internationally
- **Higher engagement**: 98% open rate vs 20% for SMS