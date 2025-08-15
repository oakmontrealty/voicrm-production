# VoiCRM Login Credentials

## Production Site: https://voicrm.com

### Admin Access
- **Username:** admin
- **Password:** VoiCRM2025!

### Agent Access
- **Username:** agent1
- **Password:** Agent#2025

- **Username:** agent2  
- **Password:** Agent@2025

### Manager Access
- **Username:** manager
- **Password:** Manager$2025

## Twilio Credentials (Already configured in .env)
- Account SID: Check .env file
- Auth Token: Check .env file
- Phone Number: +61482080888

## Development
To run locally:
```bash
npm run dev
```
Then visit: http://localhost:3000

## Mobile App Development
```bash
npm run mobile:build
npm run mobile:run-android
npm run mobile:run-ios
```

## Important Notes
- Authentication is required to access any page on voicrm.com
- JWT tokens expire after 24 hours
- All credentials are stored securely in environment variables