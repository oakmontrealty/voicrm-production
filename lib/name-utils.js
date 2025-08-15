// Utility functions for name processing and validation

// List of generic/invalid names to reject
const INVALID_NAMES = [
  'inquiry',
  'inquire',
  'owner',
  'vendor',
  'seller',
  'buyer',
  'prospect',
  'lead',
  'contact',
  'customer',
  'client',
  'tenant',
  'landlord',
  'agent',
  'broker',
  'investor',
  'developer',
  'property',
  'listing',
  'unknown',
  'n/a',
  'na',
  'none',
  'test',
  'demo',
  'sample'
];

// Common address indicators to remove
const ADDRESS_INDICATORS = [
  // Street types
  'street', 'st', 'avenue', 'ave', 'road', 'rd', 'drive', 'dr', 
  'lane', 'ln', 'court', 'ct', 'place', 'pl', 'boulevard', 'blvd',
  'parkway', 'pkwy', 'highway', 'hwy', 'circle', 'cir', 'trail', 'trl',
  
  // Unit types
  'unit', 'apt', 'apartment', 'suite', 'ste', 'floor', 'fl',
  
  // Directional
  'north', 'south', 'east', 'west', 'ne', 'nw', 'se', 'sw',
  
  // Numbers and common address patterns
  /\d+/, // Any number
  /^\d/, // Starts with number
  /#/, // Hash symbol for unit numbers
];

/**
 * Extract first name from a full name string
 * Handles cases like "John Smith 123 Main St" -> "John"
 */
export function extractFirstName(fullName) {
  if (!fullName || typeof fullName !== 'string') {
    return null;
  }

  // Clean up the string
  let cleaned = fullName.trim();
  
  // Remove everything in parentheses or brackets
  cleaned = cleaned.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '');
  
  // Split by common delimiters
  const parts = cleaned.split(/[\s,\-–—|/]+/);
  
  // Find the first valid name part
  for (const part of parts) {
    const cleanPart = part.trim().toLowerCase();
    
    // Skip if empty
    if (!cleanPart) continue;
    
    // Skip if it's a number
    if (/^\d+$/.test(cleanPart)) continue;
    
    // Skip if it contains common address indicators
    let isAddress = false;
    for (const indicator of ADDRESS_INDICATORS) {
      if (indicator instanceof RegExp) {
        if (indicator.test(cleanPart)) {
          isAddress = true;
          break;
        }
      } else if (cleanPart === indicator || cleanPart.includes(indicator)) {
        isAddress = true;
        break;
      }
    }
    if (isAddress) continue;
    
    // Skip if it's an invalid/generic name
    if (INVALID_NAMES.includes(cleanPart)) continue;
    
    // This looks like a valid first name!
    // Capitalize first letter
    return part.trim().charAt(0).toUpperCase() + part.trim().slice(1).toLowerCase();
  }
  
  return null;
}

/**
 * Validate if a name is acceptable for personalization
 * Returns { valid: boolean, reason?: string }
 */
export function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, reason: 'Name is required' };
  }
  
  const cleanName = name.trim().toLowerCase();
  
  // Check if it's empty
  if (!cleanName) {
    return { valid: false, reason: 'Name cannot be empty' };
  }
  
  // Check if it's too short (likely an initial)
  if (cleanName.length < 2) {
    return { valid: false, reason: 'Name too short' };
  }
  
  // Check if it's a number
  if (/^\d+$/.test(cleanName)) {
    return { valid: false, reason: 'Name cannot be a number' };
  }
  
  // Check against invalid names list
  if (INVALID_NAMES.includes(cleanName)) {
    return { 
      valid: false, 
      reason: `"${name}" is a generic term. Please use the actual contact name.` 
    };
  }
  
  // Check if it contains too many numbers (likely an address)
  const numberCount = (cleanName.match(/\d/g) || []).length;
  if (numberCount > 2) {
    return { 
      valid: false, 
      reason: 'Name appears to contain address information' 
    };
  }
  
  // Check for common titles that shouldn't be used as names
  const titles = ['mr', 'mrs', 'ms', 'miss', 'dr', 'prof', 'sir'];
  if (titles.includes(cleanName)) {
    return { 
      valid: false, 
      reason: 'Title detected instead of name' 
    };
  }
  
  return { valid: true };
}

/**
 * Process a contact name for mass texting
 * Returns the best first name or null if invalid
 */
export function processContactName(contact) {
  // Try to get name from contact object
  let fullName = '';
  if (typeof contact === 'string') {
    fullName = contact;
  } else if (contact.firstName) {
    // If we already have firstName field, validate and use it
    const validation = validateName(contact.firstName);
    if (validation.valid) {
      return contact.firstName.charAt(0).toUpperCase() + contact.firstName.slice(1).toLowerCase();
    }
  } else if (contact.name) {
    fullName = contact.name;
  } else if (contact.fullName) {
    fullName = contact.fullName;
  }
  
  // Extract first name from full name
  const firstName = extractFirstName(fullName);
  
  if (!firstName) {
    return null;
  }
  
  // Validate the extracted name
  const validation = validateName(firstName);
  if (!validation.valid) {
    console.warn(`Invalid name for contact: ${fullName} - ${validation.reason}`);
    return null;
  }
  
  return firstName;
}

/**
 * Generate personalized message for a contact
 * Falls back to generic greeting if name is invalid
 */
export function personalizeMessage(template, contact, options = {}) {
  const { fallbackGreeting = 'Hi', allowGeneric = false } = options;
  const firstName = processContactName(contact);
  
  if (!firstName) {
    // Use fallback greeting without name
    return template.replace(/\[NAME\]/g, '').replace(/Hi\s+,/, fallbackGreeting + ',').trim();
  }
  
  // Replace [NAME] with the actual first name
  return template.replace(/\[NAME\]/g, firstName);
}

/**
 * Check if name is a generic term that needs approval
 */
export function isGenericName(name) {
  if (!name) return false;
  const cleanName = name.trim().toLowerCase();
  const genericTerms = ['inquiry', 'inquire', 'owner', 'vendor', 'tenant', 'seller', 'buyer'];
  return genericTerms.includes(cleanName);
}

/**
 * Batch process contacts for mass texting
 * Returns array of { contact, personalizedMessage, hasValidName, needsApproval }
 */
export function processContactsForMassText(contacts, messageTemplate, options = {}) {
  const { allowGenericOverride = false } = options;
  const results = [];
  let invalidNameCount = 0;
  let genericNameCount = 0;
  
  for (const contact of contacts) {
    const fullName = typeof contact === 'string' ? contact : (contact.name || contact.fullName || '');
    const firstName = processContactName(contact);
    const hasValidName = firstName !== null;
    const isGeneric = isGenericName(fullName.split(/[\s,\-–—|/]+/)[0]);
    
    if (!hasValidName) {
      invalidNameCount++;
    }
    
    if (isGeneric) {
      genericNameCount++;
    }
    
    // Determine if this contact needs approval
    const needsApproval = isGeneric && !allowGenericOverride;
    
    const personalizedMessage = personalizeMessage(messageTemplate, contact, options);
    
    results.push({
      contact,
      fullName,
      firstName: firstName || 'Customer', // Fallback for display
      personalizedMessage,
      hasValidName,
      isGeneric,
      needsApproval,
      phone: contact.phone || contact.phoneNumber || contact.mobile,
      warningReason: !hasValidName ? 
        (isGeneric ? `"${fullName}" is a generic term` : `Invalid name: "${fullName}"`) : null
    });
  }
  
  // Return results with summary
  return {
    processed: results,
    summary: {
      total: contacts.length,
      validNames: contacts.length - invalidNameCount,
      invalidNames: invalidNameCount,
      genericNames: genericNameCount,
      needsApproval: results.filter(r => r.needsApproval).length,
      successRate: ((contacts.length - invalidNameCount) / contacts.length * 100).toFixed(1)
    }
  };
}

export default {
  extractFirstName,
  validateName,
  processContactName,
  personalizeMessage,
  processContactsForMassText
};