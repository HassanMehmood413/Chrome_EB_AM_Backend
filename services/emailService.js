import nodemailer from 'nodemailer';

/**
 * Email service for sending user credentials with support for multiple providers
 */
class EmailService {
  constructor() {
    this.emailProviders = {
      gmail: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        service: 'gmail'
      },
      outlook: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        service: 'outlook'
      },
      hotmail: {
        host: 'smtp-mail.outlook.com',
        port: 587,
        secure: false,
        service: 'hotmail'
      },
      yahoo: {
        host: 'smtp.mail.yahoo.com',
        port: 587,
        secure: false,
        service: 'yahoo'
      },
      custom: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_SECURE === 'true' || false
      }
    };

    this.transporter = this.createTransporter();
  }

  createTransporter() {
    const provider = process.env.EMAIL_PROVIDER || 'gmail';
    const config = this.emailProviders[provider];

    if (!config) {
      throw new Error(`Unsupported email provider: ${provider}`);
    }

    const transportConfig = {
      ...config,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    };

    if (provider === 'custom') {
      delete transportConfig.service;
    }

    return nodemailer.createTransport(transportConfig);
  }

  /**
   * Send welcome email with credentials
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} password - User password (generated or user-provided)
   * @param {string} loginUrl - Chrome extension login URL
   * @param {string} passwordSource - Source of password (user-provided, generated-default, etc.)
   */
  async sendWelcomeEmail(email, name, password, loginUrl = process.env.CHROME_EXTENSION_URL, passwordSource = 'generated-default') {
    try {
      const isUserPassword = passwordSource.includes('user-provided');
      const passwordMessage = isUserPassword 
        ? 'You are using the password you provided during checkout.'
        : 'We have generated a secure password for your account.';
      
      const securityNote = isUserPassword
        ? 'Since you chose your own password, please make sure it\'s secure and don\'t share it with anyone.'
        : 'Please keep this generated password secure and consider changing it after your first login.';

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Service!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your purchase! Your account has been created successfully.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p style="color: #666; font-size: 14px; margin-top: 10px;">
              ${passwordMessage}
            </p>
          </div>
          
          <p>You can now access our Chrome extension using these credentials.</p>
          ${loginUrl ? `<p><a href="${loginUrl}" style="color: #007cba;">Access Chrome Extension</a></p>` : ''}
          
          <p><strong>Important:</strong> ${securityNote}</p>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Team</p>
        </div>
      `;

      const textContent = `
Welcome ${name}!

Thank you for your purchase! Your account has been created successfully.

Your Login Credentials:
Email: ${email}
Password: ${password}

${passwordMessage}

You can now access our Chrome extension using these credentials.

Important: ${securityNote}

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Team
      `.trim();

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@yourservice.com',
        to: email,
        subject: 'Welcome! Your Account Credentials',
        html: htmlContent,
        text: textContent
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Switch to a different email provider
   * @param {string} provider - Provider name (gmail, outlook, hotmail, yahoo, custom)
   */
  switchProvider(provider) {
    if (!this.emailProviders[provider]) {
      throw new Error(`Unsupported email provider: ${provider}`);
    }
    
    process.env.EMAIL_PROVIDER = provider;
    this.transporter = this.createTransporter();
    return { success: true, message: `Switched to ${provider} provider` };
  }

  /**
   * Get available email providers
   */
  getAvailableProviders() {
    return Object.keys(this.emailProviders);
  }

  /**
   * Get current provider configuration
   */
  getCurrentProvider() {
    const provider = process.env.EMAIL_PROVIDER || 'gmail';
    return {
      provider,
      config: this.emailProviders[provider]
    };
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      const currentProvider = this.getCurrentProvider();
      return { 
        success: true, 
        message: `Email service is ready with ${currentProvider.provider} provider`,
        provider: currentProvider.provider
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;