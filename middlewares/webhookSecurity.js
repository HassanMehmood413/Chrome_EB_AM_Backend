import crypto from 'crypto';

/**
 * Middleware to verify ClickFunnels webhook authenticity
 * @param {Request} req 
 * @param {Response} res 
 * @param {Function} next 
 */
export const verifyWebhookSignature = (req, res, next) => {

  const signature = req.headers['x-clickfunnels-signature'] || req.headers['x-webhook-signature'];
  
  if (!signature) {
    return res.status(401).json({ 
      error: 'Missing webhook signature' 
    });
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(req.body))
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    if (!crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    )) {
      return res.status(401).json({ 
        error: 'Invalid webhook signature' 
      });
    }

    next();
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return res.status(401).json({ 
      error: 'Webhook signature verification failed' 
    });
  }
};

/**
 * Rate limiting middleware for webhooks
 */
const webhookAttempts = new Map();

export const rateLimitWebhook = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxAttempts = 10; // 10 requests per minute

  if (!webhookAttempts.has(ip)) {
    webhookAttempts.set(ip, []);
  }

  const attempts = webhookAttempts.get(ip);
  const validAttempts = attempts.filter(time => now - time < windowMs);
  
  if (validAttempts.length >= maxAttempts) {
    return res.status(429).json({ 
      error: 'Too many webhook requests' 
    });
  }

  validAttempts.push(now);
  webhookAttempts.set(ip, validAttempts);
  
  next();
};

/**
 * Validate webhook payload structure
 */
export const validateWebhookPayload = (req, res, next) => {
  const { email, name } = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ 
      error: 'Missing or invalid email field' 
    });
  }

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ 
      error: 'Missing or invalid name field' 
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      error: 'Invalid email format' 
    });
  }

  next();
};