const mongoose = require('mongoose');

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User id is required'],
    },
    book: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book id is required'],
    },
  },
  { timestamps: true }
);

// Compound index to ensure unique user-book pairs and fast lookups
wishlistSchema.index({ user: 1, book: 1 }, { unique: true });
// Index for fetching user's wishlist sorted by date
wishlistSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Wishlist', wishlistSchema);
