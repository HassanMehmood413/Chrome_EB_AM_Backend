import bcrypt from 'bcryptjs';
import { Schema, model } from 'mongoose';

const schema = new Schema({
  _id: { type: String },
  name: {
    type: String,
    trim: true,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: [true, "can't be blank"],
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, "can't be blank"],
    minlength: [8, 'length must be at least 8 character.']
  },
  role: {
    type: String,
    default: 'user'
  },
  status: {
    type: String,
    default: 'enabled'
  },
  createdAt: { type: Date },
  updateAt: { type: Date },
}, {
  strict: false,
  timestamps: true
});

schema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  user.password = bcrypt.hashSync(this.password, 12);
  return next();
});

schema.methods.validatePassword = function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

const User = model('user', schema);

export default User;
