import { Types } from 'mongoose';
import User from '../models/user.js';
import { generateTokenResponse } from '../middlewares/auth.js';

/**
 * Create a new user from webhook data
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} password - Generated password
 * @returns {Object} Created user and token
 */



export const createUserFromWebhook = async (email, name, password, subscriptionData = {}, billingData = {}) => {
  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    // Update existing user's subscription and billing info
    await User.updateOne(
      { email },
      { 
        $set: { 
          subscription: subscriptionData,
          billing: billingData
        }
      }
    );

    const updatedUser = await User.findOne({ email });
    return {
      user: updatedUser,
      isNew: false,
      message: 'User subscription updated'
    };
  }

  // Create new user
  const user = new User({
    _id: Types.ObjectId().toHexString(),
    name,
    email,
    password,
    role: 'user',
    status: 'enabled',
    subscription: subscriptionData,
    billing: billingData
  });

  const savedUser = await user.save();

  // Generate token
  const token = generateTokenResponse({
    userId: savedUser._id,
    email
  });

  // Update user with token
  await User.updateOne(
    { email },
    { $set: { token: token.token } }
  );

  return {
    user: savedUser,
    token,
    isNew: true,
    message: 'User created successfully from ClickFunnels purchase'
  };
};

/**
 * Generate a secure random password
 * @param {number} length - Password length (default: 12)
 * @returns {string} Generated password
 */

export const generateSecurePassword = (length = 12) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * Check if user has active subscription
 * @param {string} email - User email
 * @returns {Object} Subscription status
 */
export const checkSubscriptionStatus = async (email) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    return {
      subscribed: false,
      message: 'User not found'
    };
  }

  const now = new Date();
  const subscription = user.subscription;

  // Check if subscription is active or trial
  if (subscription.status === 'active' || subscription.status === 'trial') {
    // Check if trial is active and not expired
    if (subscription.isTrialActive && subscription.trialEndDate) {
      if (now > new Date(subscription.trialEndDate)) {
        // Auto-expire trial subscription
        await User.updateOne(
          { email },
          { 
            $set: { 
              'subscription.status': 'expired',
              'subscription.isTrialActive': false
            }
          }
        );
        return {
          subscribed: false,
          status: 'trial_expired',
          message: 'Trial period has expired. Please renew your subscription.'
        };
      }
      return {
        subscribed: true,
        status: 'trial',
        message: 'Active trial subscription',
        trialEndDate: subscription.trialEndDate
      };
    }

    // Check if regular subscription has expired (1 month limit)
    if (subscription.endDate && now > new Date(subscription.endDate)) {
      // Auto-expire subscription
      await User.updateOne(
        { email },
        { 
          $set: { 
            'subscription.status': 'expired'
          }
        }
      );
      return {
        subscribed: false,
        status: 'expired',
        message: 'Your 1-month subscription has expired. Please renew to continue access.',
        expiredDate: subscription.endDate
      };
    }

    // Calculate days remaining
    const daysRemaining = subscription.endDate ? 
      Math.ceil((new Date(subscription.endDate) - now) / (1000 * 60 * 60 * 24)) : null;

    return {
      subscribed: true,
      status: subscription.status,
      message: 'Active subscription',
      plan: subscription.plan,
      nextBillingDate: subscription.nextBillingDate,
      endDate: subscription.endDate,
      daysRemaining: daysRemaining
    };
  }

  return {
    subscribed: false,
    status: subscription.status,
    message: 'No active subscription'
  };
};

/**
 * Renew user subscription for another month
 * @param {string} email - User email
 * @param {string} newOrderId - New ClickFunnels order ID
 * @returns {Object} Renewal result
 */
export const renewSubscription = async (email, newOrderId = null) => {
  const user = await User.findOne({ email });
  
  if (!user) {
    throw new Error('User not found');
  }

  const now = new Date();
  const newEndDate = new Date(now);
  newEndDate.setMonth(newEndDate.getMonth() + 1); // Add 1 month from now

  // Update subscription
  await User.updateOne(
    { email },
    { 
      $set: { 
        'subscription.status': 'active',
        'subscription.startDate': now,
        'subscription.endDate': newEndDate,
        'subscription.nextBillingDate': newEndDate,
        'subscription.clickfunnelsOrderId': newOrderId || user.subscription.clickfunnelsOrderId,
        'subscription.isTrialActive': false
      }
    }
  );

  return {
    success: true,
    message: 'Subscription renewed for 1 month',
    newEndDate: newEndDate,
    daysAdded: 30
  };
};

/**
 * Check and auto-expire subscriptions (can be run as scheduled job)
 * @returns {Object} Expiration results
 */
export const checkAndExpireSubscriptions = async () => {
  const now = new Date();
  
  // Find all active subscriptions that have expired
  const expiredUsers = await User.find({
    $or: [
      {
        'subscription.status': 'active',
        'subscription.endDate': { $lt: now }
      },
      {
        'subscription.status': 'trial',
        'subscription.isTrialActive': true,
        'subscription.trialEndDate': { $lt: now }
      }
    ]
  });

  // Update expired subscriptions
  const expiredCount = expiredUsers.length;
  
  if (expiredCount > 0) {
    await User.updateMany(
      {
        $or: [
          {
            'subscription.status': 'active',
            'subscription.endDate': { $lt: now }
          },
          {
            'subscription.status': 'trial',
            'subscription.isTrialActive': true,
            'subscription.trialEndDate': { $lt: now }
          }
        ]
      },
      {
        $set: {
          'subscription.status': 'expired',
          'subscription.isTrialActive': false
        }
      }
    );
  }

  return {
    expiredCount,
    expiredUsers: expiredUsers.map(u => ({ email: u.email, name: u.name })),
    message: `${expiredCount} subscriptions expired`
  };
};