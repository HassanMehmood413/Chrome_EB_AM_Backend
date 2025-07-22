import Listing from '../../models/listing.js';

const GetAllListing = async ({ userId }) => {
  return Listing.distinct('asin', { userId });
};

export default GetAllListing;
