// Client-side Twilio utilities (no server dependencies)

// Format phone number for Australian market
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle Australian numbers
  if (cleaned.startsWith('61')) {
    // International format
    return `+${cleaned}`;
  } else if (cleaned.startsWith('0')) {
    // Local Australian format - convert to international
    return `+61${cleaned.substring(1)}`;
  } else if (cleaned.length === 9) {
    // Missing leading 0 - assume Australian
    return `+61${cleaned}`;
  }
  
  // Default to adding country code if not present
  return cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
};

// Call API from client
export const initiateCall = async (phoneNumber, contactId) => {
  try {
    const response = await fetch('/api/twilio/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: phoneNumber,
        contactId: contactId,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to initiate call');
    }

    return await response.json();
  } catch (error) {
    console.error('Error initiating call:', error);
    throw error;
  }
};