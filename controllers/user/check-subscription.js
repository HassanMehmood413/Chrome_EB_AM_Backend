import { checkSubscriptionStatus } from '../../services/userService.js';

const CheckSubscription = async ({ email }) => {
  if (!email) {
    const err = new Error();
    err.message = 'Email is required';
    err.statusCode = 400;
    throw err;
  }

  const subscriptionStatus = await checkSubscriptionStatus(email);
  
  return {
    ...subscriptionStatus,
    message: subscriptionStatus.message || 'Subscription status retrieved successfully'
  };
};

export default CheckSubscription;