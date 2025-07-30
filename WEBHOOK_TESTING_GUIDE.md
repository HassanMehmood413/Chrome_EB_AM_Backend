# ClickFunnels Webhook Testing Guide

## Overview
This guide explains how to test the ClickFunnels webhook integration for automatic user creation after purchase.

## Endpoints Created

### 1. Main Webhook Endpoint
- **URL**: `POST /api/clickfunnels-webhook`
- **Purpose**: Receives purchase notifications from ClickFunnels
- **Security**: Rate limiting, signature verification, payload validation

### 2. Test Endpoint
- **URL**: `POST /api/test-webhook`
- **Purpose**: Test webhook functionality without ClickFunnels
- **Security**: None (for testing only)

### 3. Health Check
- **URL**: `GET /api/webhook-health`
- **Purpose**: Check webhook service and email service health

## Setup Instructions

### 1. Install Dependencies
```bash
cd Chrome_EB_AM_backend
npm install nodemailer
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:

```env
# Required for basic functionality
PORT=5000
MONGODB_URI=mongodb://localhost:27017/your-db
JWT_SECRET=your-jwt-secret

# Required for webhook security (optional for testing)
CLICKFUNNELS_WEBHOOK_SECRET=your-webhook-secret

# Required for email notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@yourservice.com

# Optional
CHROME_EXTENSION_URL=https://your-extension-url.com
```

### 3. Start the Server
```bash
npm run dev
# or
npm start
```

## Testing Methods

### Method 1: Using Postman/Thunder Client

#### Test Health Check
```http
GET http://localhost:5000/api/webhook-health
```

Expected Response:
```json
{
  "success": true,
  "message": "Webhook service is healthy",
  "email_service": true,
  "timestamp": "2024-01-XX..."
}
```

#### Test Webhook Functionality
```http
POST http://localhost:5000/api/test-webhook
Content-Type: application/json

{
  "email": "test@example.com",
  "name": "Test User"
}
```

Expected Response:
```json
{
  "success": true,
  "message": "Test webhook processed successfully",
  "user": {
    "email": "test@example.com",
    "name": "Test User",
    "id": "user-id-here"
  },
  "isNew": true,
  "generatedPassword": "SecurePass123!"
}
```

#### Test Real Webhook (with security disabled)
```http
POST http://localhost:5000/api/clickfunnels-webhook
Content-Type: application/json

{
  "email": "customer@example.com",
  "name": "John Doe",
  "purchase_id": "test-123",
  "product_name": "Chrome Extension Access",
  "amount": "99.00"
}
```

### Method 2: Using cURL

#### Health Check
```bash
curl -X GET http://localhost:5000/api/webhook-health
```

#### Test Webhook
```bash
curl -X POST http://localhost:5000/api/test-webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### Method 3: Using ngrok for ClickFunnels Testing

1. **Install ngrok**: `npm install -g ngrok`

2. **Expose local server**:
```bash
ngrok http 5000
```

3. **Use the HTTPS URL in ClickFunnels**:
   - Example: `https://abc123.ngrok.io/api/clickfunnels-webhook`

## ClickFunnels Configuration

### Webhook Setup in ClickFunnels:
1. Go to **Funnels → Settings → Webhooks**
2. Add a new webhook:
   - **Event**: Purchase Created / Order Success
   - **URL**: `https://your-domain.com/api/clickfunnels-webhook`
   - **Method**: POST
   - **Encoding**: JSON
   - **Fields to send**: 
     - email (required)
     - name (required)
     - purchase_id (optional)
     - product_name (optional)
     - amount (optional)

### Security Headers (Optional):
- Add webhook secret in ClickFunnels settings
- Header: `X-ClickFunnels-Signature` or `X-Webhook-Signature`

## Email Testing

### Gmail Setup for SMTP:
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in `SMTP_PASS` env variable

### Test Email Manually:
```javascript
// In Node.js console or test file
import EmailService from './services/emailService.js';

const emailService = new EmailService();
await emailService.sendWelcomeEmail('test@example.com', 'Test User', 'TempPass123!');
```

## Database Verification

### Check Created Users:
```javascript
// In MongoDB or your app
import User from './models/user.js';

// Find user created by webhook
const user = await User.findOne({ email: 'test@example.com' });
console.log(user);
```

## Troubleshooting

### Common Issues:

#### 1. "Email service not ready"
- Check SMTP credentials in `.env`
- Verify Gmail App Password
- Test with: `GET /api/webhook-health`

#### 2. "User creation failed"
- Check MongoDB connection
- Verify user model requirements
- Check server logs

#### 3. "Webhook signature verification failed"
- Remove `CLICKFUNNELS_WEBHOOK_SECRET` for testing
- Verify signature format in ClickFunnels
- Check webhook security middleware

#### 4. "Rate limit exceeded"
- Wait 1 minute between tests
- Restart server to reset rate limits
- Modify rate limit settings in `webhookSecurity.js`

### Debug Mode:
- Check server console logs
- Enable verbose logging in services
- Use test endpoints for debugging

## Production Checklist

Before going live:
- [ ] Set strong `CLICKFUNNELS_WEBHOOK_SECRET`
- [ ] Configure proper SMTP credentials
- [ ] Set `NODE_ENV=production`
- [ ] Remove test endpoints or secure them
- [ ] Set up monitoring/logging
- [ ] Test with real ClickFunnels webhook
- [ ] Verify email delivery
- [ ] Test user login flow

## Security Considerations

1. **Always use HTTPS** in production
2. **Set webhook secret** for signature verification
3. **Monitor rate limits** and failed attempts
4. **Validate all input data**
5. **Log webhook events** for debugging
6. **Secure email credentials**
7. **Hash passwords** (already implemented in User model)

## Support

If you encounter issues:
1. Check server logs
2. Test with the `/test-webhook` endpoint
3. Verify environment variables
4. Test email service separately
5. Check database connectivity