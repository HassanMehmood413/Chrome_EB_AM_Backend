import 'dotenv/config';
import EmailService from './services/emailService.js';

async function testEmailService() {
    console.log('🧪 Testing Email Service Configuration...\n');
    
    const emailService = new EmailService();
    
    // Test 1: Check current provider configuration
    console.log('1. Current Provider Configuration:');
    const currentProvider = emailService.getCurrentProvider();
    console.log('   Provider:', currentProvider.provider);
    console.log('   Config:', JSON.stringify(currentProvider.config, null, 2));
    console.log('');
    
    // Test 2: List available providers
    console.log('2. Available Providers:');
    const availableProviders = emailService.getAvailableProviders();
    console.log('   ', availableProviders.join(', '));
    console.log('');
    
    // Test 3: Verify connection
    console.log('3. Verifying Email Connection...');
    try {
        const verification = await emailService.verifyConnection();
        if (verification.success) {
            console.log('   ✅ Connection successful with provider:', verification.provider);
        } else {
            console.log('   ❌ Connection failed:', verification.error);
        }
    } catch (error) {
        console.log('   ❌ Connection error:', error.message);
    }
    console.log('');
    
    // Test 4: Environment variables check
    console.log('4. Environment Variables Check:');
    console.log('   EMAIL_PROVIDER:', process.env.EMAIL_PROVIDER || 'Not set (will default to gmail)');
    console.log('   SMTP_USERNAME:', process.env.SMTP_USERNAME || 'Not set');
    console.log('   SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '***hidden***' : 'Not set');
    console.log('   FROM_EMAIL:', process.env.FROM_EMAIL || 'Not set');
    console.log('   CHROME_EXTENSION_URL:', process.env.CHROME_EXTENSION_URL || 'Not set');
    console.log('');
    
    // Test 5: Send test email (commented out to avoid spam)
    console.log('5. Test Email Sending:');
    console.log('   To send a test email, uncomment the code below and run the script');
    
    /*
    // Uncomment to send test email
    try {
        const testResult = await emailService.sendWelcomeEmail(
            'test@example.com', // Replace with your test email
            'Test User', 
            'test123456',
            process.env.CHROME_EXTENSION_URL
        );
        
        if (testResult.success) {
            console.log('   ✅ Test email sent successfully! Message ID:', testResult.messageId);
        } else {
            console.log('   ❌ Test email failed:', testResult.error);
        }
    } catch (error) {
        console.log('   ❌ Test email error:', error.message);
    }
    */
    
    console.log('\n📋 Summary:');
    console.log('- Make sure EMAIL_PROVIDER is set in your .env file');
    console.log('- Gmail requires an App Password (not your regular password)');
    console.log('- Outlook/Hotmail can use regular passwords or App Passwords');
    console.log('- For custom domains, set SMTP_HOST, SMTP_PORT, and SMTP_SECURE');
    console.log('- Test with different email providers by changing EMAIL_PROVIDER');
    console.log('\n✨ Email service test completed!');
}

// Run the test
testEmailService().catch(console.error);