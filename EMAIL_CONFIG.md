# Email Service Configuration

The email service now supports multiple email providers. Configure your environment variables as follows:

## Environment Variables

### Required for all providers:
- `SMTP_USERNAME`: Your email address
- `SMTP_PASSWORD`: Your email password or app-specific password
- `FROM_EMAIL`: The "from" email address (usually same as SMTP_USERNAME)

### Provider Selection:
- `EMAIL_PROVIDER`: Choose from: `gmail`, `outlook`, `hotmail`, `yahoo`, `custom`

## Provider-Specific Setup

### Gmail
```env
EMAIL_PROVIDER=gmail
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@gmail.com
```

**Note**: For Gmail, you need to use an "App Password" instead of your regular password. Enable 2FA and generate an app password in your Google Account settings.

### Outlook/Hotmail
```env
EMAIL_PROVIDER=outlook
SMTP_USERNAME=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=your-email@outlook.com
```

### Yahoo
```env
EMAIL_PROVIDER=yahoo
SMTP_USERNAME=your-email@yahoo.com
SMTP_PASSWORD=your-app-password
FROM_EMAIL=your-email@yahoo.com
```

### Custom SMTP Server
```env
EMAIL_PROVIDER=custom
SMTP_HOST=your-smtp-server.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USERNAME=your-username
SMTP_PASSWORD=your-password
FROM_EMAIL=noreply@yourcompany.com
```

## Usage Examples

```javascript
import EmailService from './services/emailService.js';

// Initialize service (uses EMAIL_PROVIDER from env)
const emailService = new EmailService();

// Check available providers
console.log(emailService.getAvailableProviders());
// Output: ['gmail', 'outlook', 'hotmail', 'yahoo', 'custom']

// Get current provider
console.log(emailService.getCurrentProvider());

// Switch provider (runtime)
emailService.switchProvider('outlook');

// Verify connection
const verification = await emailService.verifyConnection();
console.log(verification);
```

## Security Notes

- Always use app-specific passwords when available
- Store credentials in environment variables, never in code
- Consider using OAuth2 for production applications
- Enable 2FA on email accounts used for sending