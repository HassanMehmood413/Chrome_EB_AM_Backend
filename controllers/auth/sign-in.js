import User from '../../models/user.js';

import { generateTokenResponse } from '../../middlewares/auth.js';

const SignIn = async ({
  userId,
  email,
  name,
  status,
  role
}) => {  
  const res = generateTokenResponse({
    userId,
    email
  });

  await User.updateOne({
    email
  }, {
    $set: {
      token: res.token
    }
  });

  return {
    token: res.token,
    user: {
      userId,
      email,
      name,
      status,
      role
    }
  };
};

export default SignIn;
