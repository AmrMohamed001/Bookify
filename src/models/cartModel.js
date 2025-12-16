const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    cartItems: [
      {
        book: {
          type: mongoose.Types.ObjectId,
          ref: 'Book',
          required: true,
        },
        format: {
          type: String,
          enum: ['digital', 'physical'],
          default: 'digital',
        },
        quantity: {
          type: Number,
          default: 1,
        },
        price: Number,
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalCartPrice: Number,
    totalCartPriceAfterDiscount: Number,
    coupon: {
      type: mongoose.Types.ObjectId,
      ref: 'Coupon',
    },
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Index for efficient user cart lookup
schema.index({ user: 1 });

module.exports = mongoose.model('Cart', schema);
