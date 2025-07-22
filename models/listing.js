import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: String },
  userId: { type: String },
  asin: { type: String },
  sku: { type: String },
  draftId: { type: String },
  listingId: { type: String },
  createdAt: { type: Date },
  updateAt: { type: Date },
}, {
  strict: false,
  timestamps: true
});

const Listing = model('listing', schema);

export default Listing;
