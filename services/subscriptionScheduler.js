import { checkAndExpireSubscriptions } from './userService.js';

/**
 * Subscription scheduler to automatically expire subscriptions
 * Run this as a cron job or scheduled task
 */

class SubscriptionScheduler {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
  }

  /**
   * Start the subscription expiration checker
   * @param {number} intervalMs - Check interval in milliseconds (default: 1 hour)
   */
  start(intervalMs = 60 * 60 * 1000) { // Default: 1 hour
    if (this.isRunning) {
      console.log('Subscription scheduler is already running');
      return;
    }

    console.log(`Starting subscription scheduler (checking every ${intervalMs / 1000} seconds)`);
    
    // Run immediately once
    this.checkExpiredSubscriptions();

    // Then run at intervals
    this.intervalId = setInterval(() => {
      this.checkExpiredSubscriptions();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the subscription expiration checker
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Subscription scheduler stopped');
  }

  /**
   * Manually check and expire subscriptions
   */
  async checkExpiredSubscriptions() {
    try {
      console.log('Checking for expired subscriptions...');
      const result = await checkAndExpireSubscriptions();
      
      if (result.expiredCount > 0) {
        console.log(`Expired ${result.expiredCount} subscriptions:`, result.expiredUsers);
      } else {
        console.log('No expired subscriptions found');
      }
      
      return result;
    } catch (error) {
      console.error('Error checking expired subscriptions:', error);
      // Don't throw error to prevent scheduler from crashing
      return { expiredCount: 0, expiredUsers: [], error: error.message };
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasInterval: !!this.intervalId
    };
  }
}

// Create singleton instance
const subscriptionScheduler = new SubscriptionScheduler();

export default subscriptionScheduler;