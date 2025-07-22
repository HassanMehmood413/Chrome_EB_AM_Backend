import express from 'express';
import Joi from 'joi';

import {
  AddListing,
  DeleteListing,
  GetAllListing,
  GetListing
} from '../controllers/listing/index.js';

import validateParams from '../middlewares/validate-params.js';

import catchResponse from '../utils/catch-response.js';

const router = express.Router();

router.post('/add-listing', validateParams({
  asin: Joi.string().required(),
  sku: Joi.string().required(),
  draftId: Joi.string().optional(),
  listingId: Joi.string().optional()
}), async (req, res) => {
  try {
    const { _id: userId } = req.user;

    const {
      asin,
      sku,
      draftId,
      listingId
    } = req.body;

    await AddListing({
      userId,
      draftId,
      listingId,
      asin,
      sku
    });

    res.status(200).json({
      success: true,
      message: 'Listing Added Successfully!!!'
    });
  } catch (err) {
    catchResponse({
      res,
      err
    });
  }
});

router.post('/delete-listing', validateParams({
  asin: Joi.string().required()
}), async (req, res) => {
  try {
    const { _id: userId } = req.user;

    const {
      asin
    } = req.body;

    await DeleteListing({
      userId,
      asin
    });

    res.status(200).json({
      success: true,
      message: 'Listing Deleted Successfully!!!'
    });
  } catch (err) {
    catchResponse({
      res,
      err
    });
  }
});

router.get('/get-all-listing', async (req, res) => {
  try {
    const { _id: userId } = req.user;
  
    const listingsData = await GetAllListing({ userId });

    res.status(200).json({
      success: true,
      listingsData
    });
  } catch (error) {
    catchResponse({
      res,
      err
    });
  }
});

router.get('/get-listing', async (req, res) => {
  try {
    console.log('🔍 Debug - req.user:', req.user);
    console.log('�� Debug - req.user._id:', req.user?._id);
    console.log('🔍 Debug - req.user.userId:', req.user?.userId);
    
    const { _id: userId } = req.user;
    console.log('🔍 Debug - extracted userId:', userId);
  
    const { asin } = req.query;
    console.log('�� Debug - asin:', asin);
    
    const listingData = await GetListing({
      userId,
      asin
    });
    
    console.log('🔍 Debug - listingData:', listingData);

    res.status(200).json({
      success: true,
      listingData
    });
  } catch (error) {
    console.log('🔍 Debug - error:', error);
    catchResponse({
      res,
      err: error
    });
  }
});

export default router;
