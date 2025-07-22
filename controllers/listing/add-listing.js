import { Types } from 'mongoose';

import Listing from '../../models/listing.js';

const AddListing = async ({
  userId,
  draftId,
  listingId,
  asin,
  sku
}) => {
  console.log('📝 AddListing called with:', { userId, draftId, listingId, asin, sku });
  const updateData = {
    sku
  };
  
  // Add draftId if provided
  if (draftId) {
    updateData.draftId = draftId;
  }
  
  // Add listingId if provided (final eBay listing ID)
  if (listingId) {
    updateData.listingId = listingId;
  }
  
  const result = await Listing.updateOne({
    userId,
    asin
  }, {
    $set: updateData,
    $setOnInsert: {
      _id: new Types.ObjectId().toHexString()
    }
  }, {
    upsert: true
  });
  
  console.log('✅ Listing saved to database:', result);
  console.log('📊 Update data:', updateData);
};

export default AddListing;
