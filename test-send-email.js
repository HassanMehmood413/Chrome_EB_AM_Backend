import 'dotenv/config';
import EmailService from './services/emailService.js';

async function testSendEmail() {
    console.log('📧 Testing actual email sending...\n');
    
    const emailService = new EmailService();
    
    try {
        const result = await emailService.sendWelcomeEmail(
            'test@example.com', // Replace with a real email for testing
            'Test User',
            'testpassword123',
            process.env.CHROME_EXTENSION_URL
        );
        
        if (result.success) {
            console.log('✅ Email sent successfully!');
            console.log('   Message ID:', result.messageId);
        } else {
            console.log('❌ Email sending failed:');
            console.log('   Error:', result.error);
        }
    } catch (error) {
        console.log('❌ Email sending error:', error.message);
    }
}

testSendEmail();