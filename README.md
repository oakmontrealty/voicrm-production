# VoiCRM Production

## 🚀 Voice-Powered Real Estate CRM Platform

VoiCRM revolutionizes real estate communication with AI-powered voice recognition, automated transcription, and intelligent lead management specifically designed for Australian real estate professionals.

### Key Features

- 🎤 **Voice-First Design**: Create contacts and log interactions using natural voice commands
- 📞 **Integrated Calling**: Twilio-powered voice calls with automatic recording and transcription
- 🧠 **AI Intelligence**: GPT-4 powered conversation analysis and lead scoring
- 📱 **Mobile Optimized**: Progressive Web App for field agents
- 🏠 **Real Estate Focused**: Property-centric workflows and MLS integration
- 🇦🇺 **Australian Market**: Optimized for Australian phone numbers and accents

### Quick Start

1. **Clone the repository**
```bash
git clone https://github.com/oakmontrealty/voicrm-production.git
cd voicrm-production
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

4. **Run development server**
```bash
npm run dev
```

5. **Deploy to production**
```bash
vercel --prod
```

### Environment Variables

Required environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `OPENAI_API_KEY`: OpenAI API key for Whisper and GPT-4
- `TWILIO_ACCOUNT_SID`: Twilio account SID
- `TWILIO_AUTH_TOKEN`: Twilio auth token
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number

### Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL), Edge Functions
- **AI/ML**: OpenAI Whisper, GPT-4
- **Voice**: Twilio Voice SDK
- **Deployment**: Vercel

### Database Schema

The application uses a comprehensive database schema including:
- Contacts management
- Properties tracking
- Deals pipeline
- Interactions logging
- AI analysis storage
- Voice commands processing

### Support

For support, please contact hello@oakmontrealty.com.au

### License

Proprietary - Oakmont Realty © 2025