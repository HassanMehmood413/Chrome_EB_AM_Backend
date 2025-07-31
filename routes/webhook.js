import express from 'express';
import { createUserFromWebhook, generateSecurePassword } from '../services/userService.js';
import EmailService from '../services/emailService.js';
import { 
  verifyWebhookSignature, 
  rateLimitWebhook, 
  validateWebhookPayload 
} from '../middlewares/webhookSecurity.js';

const router = express.Router();
const emailService = new EmailService();

/**
 * ClickFunnels Webhook Endpoint
 * Handles POST requests from ClickFunnels when a purchase is completed
 */
router.post('/clickfunnels-webhook', 
  rateLimitWebhook,
  async (req, res) => {
    try {
      // Comprehensive payload logging
      console.log('='.repeat(80));
      console.log('📨 CLICKFUNNELS WEBHOOK RECEIVED');
      console.log('='.repeat(80));
      console.log('🕐 Timestamp:', new Date().toISOString());
      console.log('📄 Full Headers:', JSON.stringify(req.headers, null, 2));
      console.log('📦 Complete Payload:', JSON.stringify(req.body, null, 2));
      console.log('='.repeat(80));
      
      // Extract data from ClickFunnels webhook structure
      const email = req.body.data?.contact?.email_address;
      const firstName = req.body.data?.contact?.first_name;
      const lastName = req.body.data?.contact?.last_name;
      const name = `${firstName} ${lastName}`.trim();
      const purchase_id = req.body.data?.id;
      const product_name = req.body.data?.line_items?.[0]?.original_product?.name;
      const amount = req.body.data?.line_items?.[0]?.products_price?.amount;

      // Extract user-provided password from ClickFunnels fields
      const userPassword = req.body.data?.contact?.custom_attributes?.alphanumeric;
      const confirmPassword = req.body.data?.contact?.custom_attributes?.confirm_password;

      console.log('🔍 Custom Attributes Found:', JSON.stringify(req.body.data?.contact?.custom_attributes, null, 2));
      
      console.log('📋 Extracted Data:');
      console.log('   📧 Email:', email);
      console.log('   👤 Name:', name);
      console.log('   🆔 Purchase ID:', purchase_id);
      console.log('   📦 Product:', product_name);
      console.log('   💰 Amount:', amount);
      console.log('   🔐 User Password:', userPassword ? '***PROVIDED***' : 'NOT PROVIDED');
      console.log('   🔐 Confirm Password:', confirmPassword ? '***PROVIDED***' : 'NOT PROVIDED');

      // Determine password to use
      let passwordToUse;
      let passwordSource;

      if (userPassword && confirmPassword) {
        if (userPassword === confirmPassword) {
          passwordToUse = userPassword;
          passwordSource = 'user-provided';
          console.log('✅ Using user-provided password (passwords match)');
        } else {
          console.log('❌ Password mismatch - generating secure password instead');
          passwordToUse = generateSecurePassword(12);
          passwordSource = 'generated-mismatch';
        }
      } else if (userPassword && !confirmPassword) {
        passwordToUse = userPassword;
        passwordSource = 'user-provided-single';
        console.log('✅ Using user-provided password (single password field)');
      } else if (!userPassword && confirmPassword) {
        // Handle case where only confirm_password is provided (like in your webhook)
        passwordToUse = confirmPassword;
        passwordSource = 'user-provided-confirm-only';
        console.log('✅ Using user-provided password (from confirm_password field)');
      } else {
        passwordToUse = generateSecurePassword(12);
        passwordSource = 'generated-default';
        console.log('🔐 No user password provided - generating secure password');
      }

      // Calculate subscription end date (1 month from start)
      const startDate = new Date(req.body.data?.activated_at || new Date());
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1); // Add 1 month

      // Extract subscription and billing data
      const subscriptionData = {
        status: req.body.data?.in_trial ? 'trial' : 'active',
        plan: product_name,
        startDate: startDate,
        endDate: endDate, // Subscription expires after 1 month
        trialEndDate: req.body.data?.trial_end_at ? new Date(req.body.data.trial_end_at) : null,
        isTrialActive: req.body.data?.in_trial || false,
        clickfunnelsOrderId: purchase_id,
        amount: amount,
        currency: req.body.data?.currency || 'gbp',
        billingCycle: 'monthly', // Force monthly billing
        nextBillingDate: endDate // Next billing is when subscription expires
      };

      const billingData = {
        name: name,
        email: email,
        phone: req.body.data?.phone_number,
        address: {
          street: req.body.data?.billing_address_street_one,
          city: req.body.data?.billing_address_city,
          region: req.body.data?.billing_address_region,
          country: req.body.data?.billing_address_country,
          postalCode: req.body.data?.billing_address_postal_code
        }
      };

      // Create user in database
      console.log('👤 Creating/updating user in database...');
      const userResult = await createUserFromWebhook(email, name, passwordToUse, subscriptionData, billingData);
      console.log('✅ User operation completed:', userResult.isNew ? 'NEW USER CREATED' : 'EXISTING USER UPDATED');

      // Send welcome email with credentials (only for new users)
      let emailResult = { success: true, message: 'Email not sent - existing user' };
      if (userResult.isNew) {
        console.log('📧 Sending welcome email to new user...');
        emailResult = await emailService.sendWelcomeEmail(
          email, 
          name, 
          passwordToUse,
          process.env.CHROME_EXTENSION_URL,
          passwordSource
        );

        if (emailResult.success) {
          console.log('✅ Welcome email sent successfully! Message ID:', emailResult.messageId);
        } else {
          console.error('❌ Failed to send welcome email:', emailResult.error);
          // Don't fail the webhook if email fails, but log it
        }
      } else {
        console.log('ℹ️  Skipping email - user already exists');
      }

      // Log comprehensive webhook processing summary
      console.log('='.repeat(50));
      console.log('📊 WEBHOOK PROCESSING SUMMARY');
      console.log('='.repeat(50));
      console.log('✅ Status: SUCCESS');
      console.log('📧 Email:', email);
      console.log('👤 User:', userResult.isNew ? 'NEW' : 'EXISTING');
      console.log('🔐 Password Source:', passwordSource);
      console.log('📬 Email Sent:', emailResult.success);
      console.log('🆔 User ID:', userResult.user._id);
      console.log('💳 Subscription:', subscriptionData.status);
      console.log('🕐 Processed At:', new Date().toISOString());
      console.log('='.repeat(50));

      // Return success response to ClickFunnels
      res.status(200).json({
        success: true,
        message: userResult.message,
        user_created: userResult.isNew,
        email_sent: emailResult.success,
        password_source: passwordSource,
        webhook_id: purchase_id || 'unknown',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Return error response
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: 'Failed to process webhook'
      });
    }
  }
);

/**
 * Test endpoint for webhook functionality
 */
router.post('/test-webhook', async (req, res) => {
  try {
    const { email, name } = req.body;

    if (!email || !name) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: email and name'
      });
    }

    const generatedPassword = generateSecurePassword(12);
    const userResult = await createUserFromWebhook(email, name, generatedPassword);

    res.status(200).json({
      success: true,
      message: 'Test webhook processed successfully',
      user: {
        email: userResult.user.email,
        name: userResult.user.name,
        id: userResult.user._id
      },
      isNew: userResult.isNew,
      generatedPassword: generatedPassword // Only for testing - remove in production
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check endpoint
 */
router.get('/webhook-health', async (req, res) => {
  try {
    // Check email service
    const emailHealth = await emailService.verifyConnection();
    
    res.status(200).json({
      success: true,
      message: 'Webhook service is healthy',
      email_service: emailHealth.success,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;