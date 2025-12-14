const mongoose = require('mongoose');
const slugify = require('slugify');

const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true, // For search performance
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    isbn: {
      type: String,
      required: [true, 'ISBN is required'],
      unique: true,
      trim: true,
      index: true,
      validate: {
        validator: function (v) {
          return /^(?:\d{10}|\d{13})$/.test(v.replace(/-/g, ''));
        },
        message: 'Invalid ISBN format',
      },
    },

    description: {
      type: String,
      required: [true, 'Book description is required'],
      trim: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },

    coverImage: {
      url: String,
      publicId: String,
    },

    pdfFile: {
      url: String,
      publicId: String,
      sizeInBytes: Number,
      pageCount: Number,
    },

    preview: {
      url: String, // Signed URL to preview (first 5-10 pages)
      expiresAt: {
        type: Date,
        default: new Date(Date.now() + 30 * 60 * 1000),
      },
      pageRange: {
        type: String,
        default: '1-10',
      },
    },
    pricing: {
      digital: {
        price: {
          type: Number,
          min: 0,
        },
        currency: {
          type: String,
          default: 'USD',
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
      },
      physical: {
        price: {
          type: Number,
          min: 0,
        },
        currency: {
          type: String,
          default: 'USD',
        },
        isAvailable: {
          type: Boolean,
          default: false,
        },
        stock: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
    },
    metadata: {
      genre: [
        {
          type: String,
          index: true, // For filtering
        },
      ],
      tags: [String],
      language: {
        type: String,
        default: 'en',
      },
      publisher: String,
      publishedDate: Date,
      edition: String,
      pageCount: Number,
    },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'unpublished'],
      default: 'draft',
      index: true,
    },
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
      rejectionReason: String,
    },
    stats: {
      totalSales: {
        type: Number,
        default: 0,
      },
      averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      reviewCount: {
        type: Number,
        default: 0,
      },
      viewCount: {
        type: Number,
        default: 0,
      },
    },

    publishedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
bookSchema.index(
  {
    title: 'text',
    description: 'text',
    'metadata.genre': 'text',
    'metadata.tags': 'text',
  },
  {
    weights: {
      title: 10,
      description: 5,
      'metadata.genre': 3,
      'metadata.tags': 1,
    },
  }
);

bookSchema.index({ status: 1, author: 1 });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ 'stats.averageRating': -1 });

bookSchema.virtual('pricing.digital.finalPrice').get(function () {
  if (this.pricing.digital.price) {
    return this.pricing.digital.price;
  }
  return null;
});

bookSchema.virtual('pricing.physical.finalPrice').get(function () {
  if (this.pricing.physical.price) {
    return this.pricing.physical.price;
  }
  return null;
});

bookSchema.virtual('pricing.physical.inStock').get(function () {
  return this.pricing.physical.stock > 0;
});

bookSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'bookId',
  localField: '_id',
});

bookSchema.methods.incrementViews = function () {
  this.stats.viewCount += 1;
  return this.save();
};

bookSchema.methods.updateRating = async function () {
  const Review = mongoose.model('Review');
  const stats = await Review.aggregate([
    {
      $match: {
        bookId: this._id,
        status: 'active',
      },
    },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    this.stats.averageRating = Math.round(stats[0].avgRating * 10) / 10;
    this.stats.reviewCount = stats[0].count;
  } else {
    this.stats.averageRating = 0;
    this.stats.reviewCount = 0;
  }

  await this.save();
};

bookSchema.methods.canEdit = function () {
  return ['draft', 'rejected'].includes(this.status);
};

bookSchema.pre('save', async function () {
  if (
    !this.pricing?.digital?.isAvailable &&
    !this.pricing?.physical?.isAvailable
  ) {
    throw new Error('At least one pricing option must be available');
  }
});

bookSchema.pre('save', async function () {
  if (
    this.isModified('status') &&
    this.status === 'approved' &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

bookSchema.pre('save', function () {
  if (this.isNew) {
    this.slug = slugify(`${this.title}-${Date.now()}`, {
      lower: true,
      strict: true,
    });
  }
});

module.exports = mongoose.model('Book', bookSchema);
