const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Coupon name is required'],
      unique: true,
      uppercase: true,
    },
    expiresIn: {
      type: Date,
      required: [true, 'Coupon expiry is required'],
    },
    discount: {
      type: Number,
      required: [true, 'Discount value is required'],
      min: [1, 'Discount must be at least 1%'],
      max: [100, 'Discount cannot exceed 100%'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    usageLimit: {
      type: Number,
      default: null, // null means unlimited
    },
    usedCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Index for efficient queries
// schema.index({ name: 1 });
schema.index({ expiresIn: 1 });
schema.index({ isActive: 1 });

module.exports = mongoose.model('Coupon', schema);
