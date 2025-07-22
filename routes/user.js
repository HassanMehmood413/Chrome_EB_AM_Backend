import express from 'express';
import Joi from 'joi';

import {
  GetAllUsers,
  GetUserStatus,
  UpdateUserStatus
} from '../controllers/user/index.js';

import validateParams from '../middlewares/validate-params.js';

import catchResponse from '../utils/catch-response.js';

const router = express.Router();

router.get('/get-all-users', async (req, res) => {
  try {
    const response = await GetAllUsers();

    res.status(200).json({
      success: true,
      users: response
    });
  } catch (err) {
    catchResponse({
      res,
      err
    });
  }
});

router.get('/get-user-status', async (req, res) => {
  try {
    const { _id: userId } = req.user;
  
    const userStatus = await GetUserStatus({ userId });
    res.status(200).json({
      success: true,
      userStatus
    });
  } catch (error) {
    catchResponse({
      res,
      err
    });
  }
});

router.post('/update-user-status', validateParams({
  userId: Joi.string().required(),
  status: Joi.string().required()
}), async (req, res) => {
  try {
    const {
      userId,
      status
    } = req.body;

    await UpdateUserStatus({
      userId,
      status
    });

    res.status(200).json({
      success: true,
      message: 'User Status Updated Successfully'
    });
  } catch (err) {
    catchResponse({
      res,
      err
    });
  }
});

// Webhook endpoint for ClickFunnels
router.post('/webhook/clickfunnels', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !name) {
      return res.status(400).json({ success: false, message: 'Email and name are required.' });
    }

    // Generate a random password
    const generatedPassword = Math.random().toString(36).slice(-8) + 'A1!'; // ensure some complexity

    // Check if user exists
    let user = await require('../models/user').default.findOne({ email });
    if (!user) {
      // Create new user
      const { Types } = require('mongoose');
      user = new (require('../models/user').default)({
        _id: Types.ObjectId().toHexString(),
        name,
        email,
        password: generatedPassword,
        status: 'enabled',
      });
      await user.save();
    } else {
      // If user exists, ensure status is enabled
      if (user.status !== 'enabled') {
        user.status = 'enabled';
        await user.save();
      }
    }

    return res.status(200).json({ success: true, message: 'User created or updated', user: { email, name, status: 'enabled' } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
