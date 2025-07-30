import { renewSubscription } from '../../services/userService.js';

const RenewSubscription = async ({ email, orderId = null }) => {
  if (!email) {
    const err = new Error();
    err.message = 'Email is required';
    err.statusCode = 400;
    throw err;
  }

  const renewalResult = await renewSubscription(email, orderId);
  
  return {
    ...renewalResult,
    message: renewalResult.message || 'Subscription renewed successfully'
  };
};

export default RenewSubscription;