const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [
      {
        bookId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Book',
          required: true,
        },
        title: { type: String, required: true },
        format: { type: String, enum: ['digital', 'physical'], required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    pricing: {
      subtotal: { type: Number, required: true },
      tax: { type: Number, required: true },
      shipping: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    shippingAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    payment: {
      method: {
        type: String,
        enum: ['stripe', 'paypal', 'cash'],
        required: true,
      },
      transactionId: { type: String, required: true },
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        required: true,
      },
      paidAt: { type: Date },
    },
    fulfillment: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        required: true,
      },
      shippedAt: { type: Date },
      deliveredAt: { type: Date },
      trackingNumber: { type: String },
      carrier: { type: String },
    },
    invoice: {
      url: { type: String },
      generatedAt: { type: Date },
    },
  },
  { timestamps: true }
);
const model = mongoose.model('Order', schema);
module.exports = model;
