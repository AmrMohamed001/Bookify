const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Types.ObjectId,
      ref: 'Book',
      required: [true, 'Book is required'],
      index: true,
    },
    userId: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    rating: {
      type: Number,
      min: [1, 'rating must be greater than or equal 1'],
      max: [5, 'rating must be less than or equal 5'],
      required: true,
    },
    reviewText: {
      type: String,
      trim: true,
      required: [true, 'review text is required'],
      maxLength: [1000, 'string max size is 1000 char'],
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    helpfulBy: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    isVerifiedPurchase: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'hidden', 'deleted'],
      default: 'active',
    },
    moderatedBy: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
    },
    moderatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes for sorting
schema.index({ bookId: 1, createdAt: -1 });
schema.index({ bookId: 1, rating: -1 });
schema.index({ bookId: 1, helpfulCount: -1 });

// Populate user on find (no next() needed in Mongoose 6+)
schema.pre(/^find/, function () {
  this.populate({
    path: 'userId',
    select: 'firstName lastName profile.avatar',
  });
});

// Static method to calculate and update book stats
schema.statics.calcAverageRatings = async function (bookId) {
  const Book = mongoose.model('Book');

  // Ensure bookId is an ObjectId for proper matching
  const bookObjectId =
    typeof bookId === 'string' ? new mongoose.Types.ObjectId(bookId) : bookId;

  const stats = await this.aggregate([
    {
      $match: { bookId: bookObjectId, status: 'active' },
    },
    {
      $group: {
        _id: '$bookId',
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await Book.findByIdAndUpdate(bookId, {
      'stats.averageRating': Math.round(stats[0].avgRating * 10) / 10,
      'stats.reviewCount': stats[0].count,
    });
  } else {
    // No reviews - reset to defaults
    await Book.findByIdAndUpdate(bookId, {
      'stats.averageRating': 0,
      'stats.reviewCount': 0,
    });
  }
};

// Update book stats after saving a review
schema.post('save', async function () {
  await this.constructor.calcAverageRatings(this.bookId);
});

// Update book stats after deleting a review
schema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    await doc.constructor.calcAverageRatings(doc.bookId);
  }
});

module.exports = mongoose.model('Review', schema);
