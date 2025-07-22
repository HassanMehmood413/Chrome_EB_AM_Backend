import express from 'express';
import Joi from 'joi';
import passwordComplexity from 'joi-password-complexity';

import {
  AddUser,
  SignIn
} from '../controllers/auth/index.js';

import { loginCheck } from '../middlewares/auth.js';
import validateParams from '../middlewares/validate-params.js';

import catchResponse from '../utils/catch-response.js';

const router = express.Router();

const complexityOptions = {
  min: 8,
  max: 30
};

router.post('/add-user', validateParams({
  name: Joi.string().required(),
  email: Joi.string().required().email(),
  password: passwordComplexity(complexityOptions)
}), async (req, res) => {
  try {
    const {
      name,
      email,
      password
    } = req.body;

    const response = await AddUser({
      name,
      email,
      password
    });

    res.status(200).json({
      success: true,
      ...response
    });
  } catch (err) {
    await catchResponse({
      res,
      err
    });
  }
});

router.post('/sign-in', validateParams({
  email: Joi.string().required().email(),
  password: Joi.string().required()
}), loginCheck, async (req, res) => {
  try {
    if (req?.error) {
      const err = new Error();
      err.message = 'Email or Password is incorrect';
      err.statusCode = 400;
      throw err;
    }

    const { email } = req.body;
    const {
      _id: userId,
      name,
      status,
      role
    } = req.user || {};

    const response = await SignIn({
      userId,
      email,
      name,
      status,
      role
    });

    res.status(200).json({
      success: true,
      message: 'Sign In Successfully',
      ...response
    });
  } catch (err) {
    await catchResponse({
      res,
      err
    });
  }
});

export default router;
