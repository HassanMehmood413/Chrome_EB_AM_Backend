import nodemailer from 'nodemailer';

/**
 * Email service for sending user credentials
 */
class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }

  /**
   * Send welcome email with credentials
   * @param {string} email - User email
   * @param {string} name - User name
   * @param {string} password - Generated password
   * @param {string} loginUrl - Chrome extension login URL
   */
  async sendWelcomeEmail(email, name, password, loginUrl = process.env.CHROME_EXTENSION_URL) {
    try {
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to Our Service!</h2>
          <p>Hi ${name},</p>
          <p>Thank you for your purchase! Your account has been created successfully.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Your Login Credentials:</h3>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
          </div>
          
          <p>You can now access our Chrome extension using these credentials.</p>
          ${loginUrl ? `<p></p>` : ''}
          
          <p><strong>Important:</strong> Please keep these credentials secure and consider changing your password after first login.</p>
          
          <p>If you have any questions, please don't hesitate to contact our support team.</p>
          
          <p>Best regards,<br>The Team</p>
        </div>
      `;

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@yourservice.com',
        to: email,
        subject: 'Welcome! Your Account Credentials',
        html: htmlContent,
        text: `Welcome ${name}! Your login credentials: Email: ${email}, Password: ${password}`
      };

      const result = await this.transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email sending error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      return { success: true, message: 'Email service is ready' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

export default EmailService;