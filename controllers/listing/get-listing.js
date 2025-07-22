import Listing from '../../models/listing.js';

const GetListing = async ({
  userId,
  asin
}) => {
  return Listing.findOne({
    userId,
    asin
  });
};

export default GetListing;
