import { checkAndExpireSubscriptions } from '../../services/userService.js';

const ExpireSubscriptions = async () => {
  const expirationResult = await checkAndExpireSubscriptions();
  
  return {
    ...expirationResult,
    message: expirationResult.message || 'Subscription expiration check completed'
  };
};

export default ExpireSubscriptions;