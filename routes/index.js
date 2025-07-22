import express from 'express';

import auth from './auth.js';
import listing from './listing.js';
import user from './user.js';

import { AuthenticateAuthToken } from '../middlewares/auth.js';

const router = express.Router();

router.use('/auth', auth);
router.use('/listing', AuthenticateAuthToken, listing);
router.use('/user', AuthenticateAuthToken, user);

export default router;
