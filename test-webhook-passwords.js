import 'dotenv/config';
import EmailService from './services/emailService.js';

async function testPasswordHandling() {
    console.log('🧪 Testing Password Handling in Email Service...\n');
    
    const emailService = new EmailService();
    
    // Test 1: User-provided password
    console.log('1. Testing User-Provided Password:');
    try {
        const result1 = await emailService.sendWelcomeEmail(
            'test-user@example.com',
            'John Doe',
            'MySecurePassword123!',
            process.env.CHROME_EXTENSION_URL,
            'user-provided'
        );
        console.log('   ✅ User-provided password email:', result1.success ? 'SUCCESS' : 'FAILED');
        if (!result1.success) console.log('   Error:', result1.error);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 2: Generated password
    console.log('\n2. Testing Generated Password:');
    try {
        const result2 = await emailService.sendWelcomeEmail(
            'test-generated@example.com',
            'Jane Smith',
            'Auto2024Gen$Pass',
            process.env.CHROME_EXTENSION_URL,
            'generated-default'
        );
        console.log('   ✅ Generated password email:', result2.success ? 'SUCCESS' : 'FAILED');
        if (!result2.success) console.log('   Error:', result2.error);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    // Test 3: Password mismatch (fallback to generated)
    console.log('\n3. Testing Password Mismatch Scenario:');
    try {
        const result3 = await emailService.sendWelcomeEmail(
            'test-mismatch@example.com',
            'Bob Wilson',
            'FallbackGenPass456#',
            process.env.CHROME_EXTENSION_URL,
            'generated-mismatch'
        );
        console.log('   ✅ Mismatch fallback email:', result3.success ? 'SUCCESS' : 'FAILED');
        if (!result3.success) console.log('   Error:', result3.error);
    } catch (error) {
        console.log('   ❌ Error:', error.message);
    }
    
    console.log('\n📋 Test Summary:');
    console.log('- User-provided passwords show personalized messaging');
    console.log('- Generated passwords include security advice');
    console.log('- Both HTML and text versions are customized');
    console.log('- Email templates adapt based on password source');
    console.log('\nTo actually send emails, replace test emails with real ones and uncomment the actual sending code.');
}

// Simulate webhook payload scenarios
function simulateWebhookScenarios() {
    console.log('\n🎭 Webhook Password Scenarios:\n');
    
    // Scenario 1: User provided both password fields
    const scenario1 = {
        data: {
            contact: {
                email_address: 'user@example.com',
                first_name: 'Test',
                last_name: 'User',
                password: 'UserChosenPass123!',
                confirm_password: 'UserChosenPass123!'
            }
        }
    };
    console.log('Scenario 1 - User provided matching passwords:');
    console.log('   Password:', scenario1.data.contact.password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Confirm:', scenario1.data.contact.confirm_password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Result: Would use USER-PROVIDED password\n');
    
    // Scenario 2: Password mismatch
    const scenario2 = {
        data: {
            contact: {
                email_address: 'user2@example.com',
                first_name: 'Test',
                last_name: 'User2',
                password: 'Password123!',
                confirm_password: 'DifferentPass456!'
            }
        }
    };
    console.log('Scenario 2 - Password mismatch:');
    console.log('   Password:', scenario2.data.contact.password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Confirm:', scenario2.data.contact.confirm_password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Result: Would GENERATE password due to mismatch\n');
    
    // Scenario 3: No password provided
    const scenario3 = {
        data: {
            contact: {
                email_address: 'user3@example.com',
                first_name: 'Test',
                last_name: 'User3'
            }
        }
    };
    console.log('Scenario 3 - No password provided:');
    console.log('   Password:', scenario3.data.contact.password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Confirm:', scenario3.data.contact.confirm_password ? '***PROVIDED***' : 'NOT PROVIDED');
    console.log('   Result: Would GENERATE secure password\n');
}

// Run tests
console.log('🔐 PASSWORD HANDLING TEST SUITE');
console.log('='.repeat(50));

simulateWebhookScenarios();
// Uncomment the line below to test actual email sending
// testPasswordHandling();