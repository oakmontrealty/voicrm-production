// Mobile App Configuration for VoiCRM
export const mobileConfig = {
  // App Details
  app: {
    name: 'VoiCRM',
    displayName: 'VoiCRM - Real Estate CRM',
    version: '1.0.0',
    description: 'Professional Real Estate CRM with SMS, WhatsApp, and AI-powered calling'
  },

  // iOS Specific
  ios: {
    bundleId: 'com.voicrm.app',
    teamId: 'YOUR_TEAM_ID', // Get from Apple Developer
    scheme: 'voicrm',
    capabilities: [
      'push-notifications',
      'background-fetch',
      'remote-notification',
      'voip'
    ]
  },

  // Android Specific  
  android: {
    packageName: 'com.voicrm.app',
    versionCode: 1,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.CAMERA',
      'android.permission.READ_CONTACTS',
      'android.permission.CALL_PHONE',
      'android.permission.SEND_SMS',
      'android.permission.RECEIVE_SMS',
      'android.permission.VIBRATE',
      'android.permission.ACCESS_NETWORK_STATE'
    ]
  },

  // Features
  features: {
    sms: true,
    whatsapp: true,
    calling: true,
    pushNotifications: true,
    biometricAuth: false,
    offlineMode: true,
    camera: true,
    contacts: true
  },

  // API Endpoints
  api: {
    baseUrl: 'https://voicrm.com',
    smsEndpoint: '/api/twilio/send-sms',
    whatsappEndpoint: '/api/twilio/whatsapp',
    voiceEndpoint: '/api/twilio/voice'
  },

  // Theming
  theme: {
    primaryColor: '#636B56',
    secondaryColor: '#864936',
    backgroundColor: '#F8F2E7',
    statusBarColor: '#636B56',
    statusBarStyle: 'light'
  },

  // Deep Links
  deepLinks: {
    scheme: 'voicrm',
    host: 'app',
    paths: {
      messages: '/messages',
      contacts: '/contacts',
      calls: '/calls',
      whatsapp: '/messages?type=whatsapp'
    }
  }
};

export default mobileConfig;