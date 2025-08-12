# VoiCRM Production

Voice-Powered CRM for Real Estate Professionals

## Status
✅ Live at: https://voicrm-production.vercel.app
✅ Dialer: Fully functional with Twilio
✅ Voice Calls: Working (no more Rick Astley!)

## Features
- 📞 Make real phone calls
- 🎤 Voice-powered contact logging
- 📊 Professional dashboard
- 🏢 Oakmont Realty integration

## Twilio Setup

To enable proper voice calls (not demo audio):

1. **In Twilio Console:**
   - Go to Phone Numbers → Manage → Active Numbers
   - Click on your phone number
   - Set the Voice Webhook to: `https://voicrm-production.vercel.app/api/incoming-call`
   - Save

2. **Environment Variables (Already Set):**
   - TWILIO_ACCOUNT_SID
   - TWILIO_AUTH_TOKEN
   - TWILIO_PHONE_NUMBER

## Making Calls

1. Click "Open Dialer"
2. Enter phone number
3. Press Call
4. You can now have a real conversation!

## Call Types

- **Outbound**: You → Customer (working)
- **Inbound**: Customer → You (configure webhook)
- **Call Recording**: Available (set record: true in make-call.js)

---
Powered by Oakmont Realty
Last Updated: January 30, 2025