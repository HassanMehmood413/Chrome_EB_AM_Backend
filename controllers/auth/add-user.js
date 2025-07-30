import { Types } from 'mongoose';

import User from '../../models/user.js';

import { generateTokenResponse } from '../../middlewares/auth.js';

const SignUp = async ({
  name,
  email,
  password
}) => {
  let result;
  let user = await User.findOne({ email });
  if (user) {
    const err = new Error();
    err.message = 'This Email is already taken';
    err.statusCode = 400;
    throw err;
  }

  user = new User({
    _id: Types.ObjectId().toHexString(),
    name,
    email,
    password,
    subscription: {
      status: 'inactive',
      plan: null,
      startDate: null,
      endDate: null,
      trialEndDate: null,
      isTrialActive: false,
      clickfunnelsOrderId: null,
      amount: null,
      currency: 'gbp',
      billingCycle: 'monthly',
      nextBillingDate: null
    },
    billing: {
      name: name,
      email: email,
      phone: null,
      address: {
        street: null,
        city: null,
        region: null,
        country: null,
        postalCode: null
      }
    }
  });

  result = await user.save();

  const token = generateTokenResponse({
    userId: result._id,
    email
  });

  await User.updateOne({
    email
  }, {
    $set: {
      token: token.token
    }
  });

  return {
    user: result,
    token,
    message: 'SignUp Successfully!'
  };
};

export default SignUp;
