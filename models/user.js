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
  subscription: {
    status: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled', 'expired'],
      default: 'inactive'
    },
    plan: {
      type: String,
      default: null
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null
    },
    trialEndDate: {
      type: Date,
      default: null
    },
    isTrialActive: {
      type: Boolean,
      default: false
    },
    clickfunnelsOrderId: {
      type: String,
      default: null
    },
    amount: {
      type: String,
      default: null
    },
    currency: {
      type: String,
      default: 'gbp'
    },
    billingCycle: {
      type: String,
      enum: ['monthly', 'yearly', 'one-time'],
      default: 'monthly'
    },
    nextBillingDate: {
      type: Date,
      default: null
    }
  },
  billing: {
    name: {
      type: String,
      default: null
    },
    email: {
      type: String,
      default: null
    },
    phone: {
      type: String,
      default: null
    },
    address: {
      street: { type: String, default: null },
      city: { type: String, default: null },
      region: { type: String, default: null },
      country: { type: String, default: null },
      postalCode: { type: String, default: null }
    }
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
  console.log('Password validation debug:');
  console.log('- Candidate password length:', candidatePassword?.length);
  console.log('- Stored password hash length:', this.password?.length);
  console.log('- Hash starts with $2a$ or $2b$:', this.password?.startsWith('$2a$') || this.password?.startsWith('$2b$'));
  
  try {
    const result = bcrypt.compareSync(candidatePassword, this.password);
    console.log('- bcrypt.compareSync result:', result);
    return result;
  } catch (error) {
    console.error('- bcrypt.compareSync error:', error);
    return false;
  }
};

const User = model('user', schema);

export default User;
