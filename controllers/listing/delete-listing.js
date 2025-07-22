import { Types } from 'mongoose';

import Listing from '../../models/listing.js';

const DeleteListing = async ({
  userId,
  asin
}) => {
  await Listing.deleteOne({
    userId,
    asin
  });
};

export default DeleteListing;
