# Password Handling System

The webhook now supports both user-provided passwords and auto-generated passwords, with comprehensive logging and smart email templates.

## How It Works

### Password Source Detection

The webhook checks for password fields in the ClickFunnels custom attributes:

1. `req.body.data.contact.custom_attributes.password`
2. `req.body.data.contact.custom_attributes.confirm_password`

### Password Logic

| Scenario | Action | Password Source |
|----------|--------|----------------|
| Both fields provided and match | Use user password | `user-provided` |
| Both fields provided but don't match | Generate secure password | `generated-mismatch` |
| Only password field provided | Use user password | `user-provided-single` |
| Only confirm_password field provided | Use confirm password | `user-provided-confirm-only` |
| No password fields provided | Generate secure password | `generated-default` |

### Email Templates

The email templates now adapt based on the password source:

#### User-Provided Password
- Message: "You are using the password you provided during checkout."
- Security note: "Since you chose your own password, please make sure it's secure and don't share it with anyone."

#### Generated Password
- Message: "We have generated a secure password for your account."
- Security note: "Please keep this generated password secure and consider changing it after your first login."

## ClickFunnels Integration

### Required Form Fields

To enable user password selection, add these fields to your ClickFunnels form with custom attributes:

#### Password Field
- **Element**: Input field (password type)
- **Custom Attribute**: 
  - Name: `name`
  - Value: `password`

#### Confirm Password Field
- **Element**: Input field (password type)  
- **Custom Attribute**:
  - Name: `name`
  - Value: `confirm_password`

This will create custom attributes that appear in the webhook payload as:
```json
{
  "custom_attributes": {
    "password": "user_chosen_password",
    "confirm_password": "user_chosen_password"
  }
}
```

## Webhook Response

The webhook now returns additional information:

```json
{
  "success": true,
  "message": "User created successfully from ClickFunnels purchase",
  "user_created": true,
  "email_sent": true,
  "password_source": "user-provided",
  "webhook_id": "cf_order_123456",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Enhanced Logging

The webhook now provides comprehensive logging:

### 1. Payload Logging
```
================================================================================
📨 CLICKFUNNELS WEBHOOK RECEIVED
================================================================================
🕐 Timestamp: 2024-01-15T10:30:00.000Z
📄 Full Headers: { ... }
📦 Complete Payload: { ... }
================================================================================
```

### 2. Data Extraction
```
📋 Extracted Data:
   📧 Email: user@example.com
   👤 Name: John Doe
   🆔 Purchase ID: cf_order_123456
   📦 Product: Premium Subscription
   💰 Amount: 29.99
   🔐 User Password: ***PROVIDED***
   🔐 Confirm Password: ***PROVIDED***
```

### 3. Password Decision
```
✅ Using user-provided password (passwords match)
```

### 4. Processing Steps
```
👤 Creating/updating user in database...
✅ User operation completed: NEW USER CREATED
📧 Sending welcome email to new user...
✅ Welcome email sent successfully! Message ID: <message_id>
```

### 5. Summary
```
==================================================
📊 WEBHOOK PROCESSING SUMMARY
==================================================
✅ Status: SUCCESS
📧 Email: user@example.com
👤 User: NEW
🔐 Password Source: user-provided
📬 Email Sent: true
🆔 User ID: 507f1f77bcf86cd799439011
💳 Subscription: active
🕐 Processed At: 2024-01-15T10:30:00.000Z
==================================================
```

## Security Features

1. **Password Validation**: Mismatched passwords trigger fallback to generated passwords
2. **Secure Logging**: Passwords are never logged in plain text (shown as `***PROVIDED***`)
3. **Email Security**: Different security advice based on password source
4. **Comprehensive Audit Trail**: All actions are logged with timestamps

## Testing

### Manual Testing

Use the test webhook endpoint:

```bash
curl -X POST http://localhost:3001/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User"
  }'
```

### Password Scenarios Testing

Run the test script:

```bash
node test-webhook-passwords.js
```

### Email Configuration Testing

Run the email test:

```bash
node test-email.js
```

## Environment Variables

Make sure these are configured in your `.env`:

```env
# Email Configuration
EMAIL_PROVIDER=gmail
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
CHROME_EXTENSION_URL=https://your-extension-url.com
```

## Troubleshooting

### Common Issues

1. **Emails not sending**: Check `EMAIL_PROVIDER` and SMTP credentials
2. **Generated passwords always used**: Check ClickFunnels field names
3. **Missing password fields**: Verify ClickFunnels form configuration

### Debug Mode

Enable verbose logging by setting:
```env
NODE_ENV=development
```

This will provide even more detailed console output for debugging webhook issues.