import jwt from 'jsonwebtoken';
import passport from 'passport';
import { Strategy as JWTstrategy, ExtractJwt } from 'passport-jwt';
import LocalStrategy from 'passport-local';

import User from '../models/user.js';

const { HASHING_SECRET_KEY } = process.env;

const generateTokenResponse = ({
  userId,
  email
},
verify = false) => {
  const expiryTime = '365d';
  return {
    token: jwt.sign({ userId, email }, HASHING_SECRET_KEY, {
      expiresIn: expiryTime
    })
  };
};

const loginCheck = (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (!user) {
      req.error = info.error;
      req.subscriptionUrl = info.subscriptionUrl;
      req.needsSubscription = info.needsSubscription;
    } else {
      req.user = user;
    }
    next();
  })(req, res, next);
};

const checkSubscriptionStatus = (user) => {
  if (!user.subscription) {
    return {
      isValid: false,
      error: 'No subscription found. Please subscribe to access the extension.',
      subscriptionUrl: process.env.SUBSCRIPTION_URL || 'https://go.ecommiracle.com/ecommiracle'
    };
  }

  const { status, endDate, isTrialActive, trialEndDate } = user.subscription;

  // Check if trial is active and not expired
  if (isTrialActive && trialEndDate) {
    const now = new Date();
    if (now > new Date(trialEndDate)) {
      return {
        isValid: false,
        error: 'Your trial subscription has expired. Please upgrade to continue using the extension.',
        subscriptionUrl: process.env.SUBSCRIPTION_URL || 'https://go.ecommiracle.com/ecommiracle'
      };
    }
    return { isValid: true };
  }

  // Check subscription status
  if (status === 'inactive' || status === 'cancelled' || status === 'expired') {
    return {
      isValid: false,
      error: 'Your subscription is not active. Please renew your subscription to continue.',
      subscriptionUrl: process.env.SUBSCRIPTION_URL || 'https://go.ecommiracle.com/ecommiracle'
    };
  }

  // Check if subscription has expired
  if (endDate && new Date() > new Date(endDate)) {
    return {
      isValid: false,
      error: 'Your subscription has expired. Please renew to continue using the extension.',
      subscriptionUrl: process.env.SUBSCRIPTION_URL || 'https://go.ecommiracle.com/ecommiracle'
    };
  }

  // If we reach here, subscription is valid
  return { isValid: true };
};

const LocalLoginStrategy = new LocalStrategy(
  {
    usernameField: 'email',
    passReqToCallback: true
  },
  async (req, email, password, done) => {
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      if (!user.password) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      const isValid = user?.validatePassword(password);
      if (!isValid) {
        return done(null, false, {
          error: 'Your login details could not be verified. Please try again.'
        });
      }

      // Check subscription status
      const subscriptionCheck = checkSubscriptionStatus(user);
      if (!subscriptionCheck.isValid) {
        return done(null, false, {
          error: subscriptionCheck.error,
          subscriptionUrl: subscriptionCheck.subscriptionUrl,
          needsSubscription: true
        });
      }

      return done(null, user);
    } catch (err) {
      done(err);
    }
  }
);

const AuthenticateAuthToken = (req, res, next) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) {
        return res.status(404).send({ success: false, error: err?.message });
      }
      if (!user) {
        return res.status(404).json({ error: 'Your session has been expired!', success: false });
      }
      req.user = user;
      return next();
    }
  )(req, res, next);
};

const checkSubscriptionMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        needsSubscription: false
      });
    }

    const subscriptionCheck = checkSubscriptionStatus(req.user);
    if (!subscriptionCheck.isValid) {
      return res.status(403).json({
        success: false,
        message: subscriptionCheck.error,
        subscriptionUrl: subscriptionCheck.subscriptionUrl,
        needsSubscription: true
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Error checking subscription status'
    });
  }
};

const AuthenticationStrategy = new JWTstrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: HASHING_SECRET_KEY
  },
  async (jwtPayload, done) => {
    try {
      const user = await User.findById(jwtPayload.userId);
      if (!user) return done(null, false);

      return done(null, user);
    } catch (err) {
      done(err, false);
    }
  }
);

export {
  AuthenticationStrategy,
  AuthenticateAuthToken,
  generateTokenResponse,
  loginCheck,
  LocalLoginStrategy,
  checkSubscriptionMiddleware
};
