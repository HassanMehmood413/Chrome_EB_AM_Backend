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
    } else {
      req.user = user;
    }
    next();
  })(req, res, next);
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
  LocalLoginStrategy
};
