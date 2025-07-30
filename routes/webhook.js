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
      console.log('Raw webhook payload:', JSON.stringify(req.body, null, 2));
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      
      // Extract data from ClickFunnels webhook structure
      const email = req.body.data?.contact?.email_address;
      const firstName = req.body.data?.contact?.first_name;
      const lastName = req.body.data?.contact?.last_name;
      const name = `${firstName} ${lastName}`.trim();
      const purchase_id = req.body.data?.id;
      const product_name = req.body.data?.line_items?.[0]?.original_product?.name;
      const amount = req.body.data?.line_items?.[0]?.products_price?.amount;

      console.log('ClickFunnels webhook received:', {
        email,
        name,
        purchase_id,
        product_name,
        amount,
        timestamp: new Date().toISOString()
      });

      // Generate secure password
      const generatedPassword = generateSecurePassword(12);

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
      const userResult = await createUserFromWebhook(email, name, generatedPassword, subscriptionData, billingData);

      // Send welcome email with credentials (only for new users)
      let emailResult = { success: true, message: 'Email not sent - existing user' };
      if (userResult.isNew) {
        emailResult = await emailService.sendWelcomeEmail(
          email, 
          name, 
          generatedPassword,
          process.env.CHROME_EXTENSION_URL
        );

        if (!emailResult.success) {
          console.error('Failed to send welcome email:', emailResult.error);
          // Don't fail the webhook if email fails, but log it
        }
      }

      // Log successful webhook processing
      console.log('Webhook processed successfully:', {
        email,
        isNewUser: userResult.isNew,
        emailSent: emailResult.success,
        userId: userResult.user._id
      });

      // Return success response to ClickFunnels
      res.status(200).json({
        success: true,
        message: userResult.message,
        user_created: userResult.isNew,
        email_sent: emailResult.success,
        webhook_id: purchase_id || 'unknown'
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