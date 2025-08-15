// Comprehensive security middleware for VoiCRM
import crypto from 'crypto';

// Rate limiting to prevent brute force attacks
const rateLimitStore = new Map();

export function rateLimit(options = {}) {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many requests, please try again later.',
    skipSuccessfulRequests = false
  } = options;

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore.has(ip)) {
      rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs });
      return next();
    }

    const limit = rateLimitStore.get(ip);
    
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + windowMs;
      rateLimitStore.set(ip, limit);
      return next();
    }

    if (limit.count >= max) {
      return res.status(429).json({ error: message });
    }

    limit.count++;
    rateLimitStore.set(ip, limit);
    next();
  };
}

// CSRF protection
export function csrfProtection(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body._csrf;
  const sessionToken = req.session?.csrfToken;

  if (!token || token !== sessionToken) {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }

  next();
}

// Generate CSRF token
export function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Input sanitization to prevent XSS and SQL injection
export function sanitizeInput(req, res, next) {
  const sanitize = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string') {
        // Remove any HTML tags
        obj[key] = obj[key].replace(/<[^>]*>/g, '');
        // Escape special characters
        obj[key] = obj[key]
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
        // Remove SQL injection attempts
        obj[key] = obj[key].replace(/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi, '');
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
}

// Security headers
export function securityHeaders(req, res, next) {
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Enable XSS filter
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Permissions policy
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(self), camera=()');
  
  // Content Security Policy
  res.setHeader('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.twilio.com wss://voice.twilio.com"
  );
  
  // Strict Transport Security
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  next();
}

// IP whitelist for admin routes
const adminWhitelist = process.env.ADMIN_IP_WHITELIST?.split(',') || [];

export function ipWhitelist(req, res, next) {
  if (adminWhitelist.length === 0) {
    return next(); // No whitelist configured
  }

  const clientIp = req.ip || req.connection.remoteAddress;
  
  if (!adminWhitelist.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied from this IP address' });
  }

  next();
}

// Session security
export function sessionSecurity(req, res, next) {
  if (!req.session) {
    return next();
  }

  // Check session timeout (15 minutes of inactivity)
  const now = Date.now();
  const maxAge = 15 * 60 * 1000; // 15 minutes

  if (req.session.lastActivity && (now - req.session.lastActivity) > maxAge) {
    req.session.destroy();
    return res.status(401).json({ error: 'Session expired' });
  }

  req.session.lastActivity = now;
  next();
}

// Audit logging
export function auditLog(req, res, next) {
  const log = {
    timestamp: new Date().toISOString(),
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    userId: req.session?.userId || 'anonymous',
    userAgent: req.headers['user-agent']
  };

  // Log sensitive operations
  if (req.path.includes('/api/auth') || 
      req.path.includes('/api/contacts') ||
      req.path.includes('/api/admin')) {
    console.log('[AUDIT]', JSON.stringify(log));
    // In production, send to logging service
  }

  next();
}

// Encryption utilities
const algorithm = 'aes-256-gcm';
const secretKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');

export function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

export function decrypt(encryptedData) {
  try {
    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(secretKey, 'hex'),
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

// Apply all security middleware
export function applySecurity(app) {
  // Basic security
  app.use(securityHeaders);
  app.use(sanitizeInput);
  app.use(auditLog);
  
  // Rate limiting for all routes
  app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
  
  // Stricter rate limiting for auth routes
  app.use('/api/auth/login', rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 5,
    message: 'Too many login attempts. Please try again later.'
  }));
  
  // Session security
  app.use(sessionSecurity);
  
  // CSRF protection for state-changing operations
  app.use('/api', csrfProtection);
  
  // IP whitelist for admin routes
  app.use('/api/admin', ipWhitelist);
  
  console.log('✅ Security middleware applied');
}

// Export for use in API routes
export default {
  rateLimit,
  csrfProtection,
  generateCSRFToken,
  sanitizeInput,
  securityHeaders,
  ipWhitelist,
  sessionSecurity,
  auditLog,
  encrypt,
  decrypt,
  applySecurity
};