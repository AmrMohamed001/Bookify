const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema(
  {
    // ==================== BASIC INFO ====================
    title: {
      type: String,
      required: [true, 'Book title is required'],
      trim: true,
      index: true, // For search performance
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

    // ==================== AUTHOR INFO ====================
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },

    // ==================== CATEGORY ====================
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },

    // ==================== COVER IMAGE ====================
    coverImage: {
      url: String,
      publicId: String, // Cloudinary public ID for deletion
    },

    // ==================== PDF FILE ====================
    pdfFile: {
      url: String,
      publicId: String, // Cloudinary public ID
      sizeInBytes: Number,
      pageCount: Number,
    },

    // ==================== PREVIEW ====================
    preview: {
      url: String, // Signed URL to preview (first 5-10 pages)
      expiresAt: {
        type: Date,
        default: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      },
      pageRange: {
        type: String,
        default: '1-10',
      },
    },

    // ==================== PRICING ====================
    // Support BOTH digital and physical books!
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
      validate: {
        validator: function () {
          return (
            this.pricing.digital.isAvailable ||
            this.pricing.physical.isAvailable
          );
        },
        message: 'At least one pricing option must be available',
      },
    },

    // ==================== METADATA ====================
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

    // ==================== STATUS ====================
    // Book approval workflow!
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected', 'unpublished'],
      default: 'draft',
      index: true,
    },

    // ==================== ADMIN REVIEW ====================
    adminReview: {
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      reviewedAt: Date,
      rejectionReason: String,
    },

    // ==================== STATS ====================
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

    // ==================== PUBLISHED DATE ====================
    publishedAt: Date,
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ==================== INDEXES FOR PERFORMANCE ====================
// Text search index for search functionality
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

// Compound index for filtering
bookSchema.index({ status: 1, author: 1 });
bookSchema.index({ category: 1, status: 1 });
bookSchema.index({ 'stats.averageRating': -1 });

// // ==================== VIRTUALS ====================
// // Calculate discount price if needed
// bookSchema.virtual('pricing.digital.finalPrice').get(function () {
//   if (this.pricing.digital.price) {
//     return this.pricing.digital.price;
//   }
//   return null;
// });
//
// bookSchema.virtual('pricing.physical.finalPrice').get(function () {
//   if (this.pricing.physical.price) {
//     return this.pricing.physical.price;
//   }
//   return null;
// });
//
// // Check if book is in stock (for physical)
// bookSchema.virtual('pricing.physical.inStock').get(function () {
//   return this.pricing.physical.stock > 0;
// });
//
// // ==================== METHODS ====================
// // Increment view count
// bookSchema.methods.incrementViews = function () {
//   this.stats.viewCount += 1;
//   return this.save();
// };
//
// // Update average rating
// bookSchema.methods.updateRating = async function () {
//   const Review = mongoose.model('Review');
//   const stats = await Review.aggregate([
//     {
//       $match: {
//         bookId: this._id,
//         status: 'active',
//       },
//     },
//     {
//       $group: {
//         _id: null,
//         avgRating: { $avg: '$rating' },
//         count: { $sum: 1 },
//       },
//     },
//   ]);
//
//   if (stats.length > 0) {
//     this.stats.averageRating = Math.round(stats[0].avgRating * 10) / 10; // Round to 1 decimal
//     this.stats.reviewCount = stats[0].count;
//   } else {
//     this.stats.averageRating = 0;
//     this.stats.reviewCount = 0;
//   }
//
//   await this.save();
// };
//
// // Check if user can edit (only draft or rejected)
// bookSchema.methods.canEdit = function () {
//   return ['draft', 'rejected'].includes(this.status);
// };
//
// // ==================== STATIC METHODS ====================
// // Get available books (for public)
// bookSchema.statics.getAvailableBooks = function (filter = {}) {
//   return this.find({
//     status: 'approved',
//     ...filter,
//   })
//     .populate('category', 'name')
//     .populate('author.userId', 'firstName lastName');
// };
//
// // Get author's books
// bookSchema.statics.getAuthorBooks = function (authorId, status = null) {
//   const query = { 'author.userId': authorId };
//   if (status) {
//     query.status = status;
//   }
//   return this.find(query).populate('category', 'name');
// };
//
// // ==================== PRE-SAVE HOOKS ====================
// // Set published date when approved
// bookSchema.pre('save', function (next) {
//   if (
//     this.isModified('status') &&
//     this.status === 'approved' &&
//     !this.publishedAt
//   ) {
//     this.publishedAt = new Date();
//   }
//   next();
// });
//
// // ==================== QUERY HELPERS ====================
// bookSchema.query.byStatus = function (status) {
//   return this.where({ status });
// };
//
// bookSchema.query.byGenre = function (genre) {
//   return this.where({ 'metadata.genre': genre });
// };
//
// bookSchema.query.inPriceRange = function (min, max) {
//   return this.where({
//     $or: [
//       { 'pricing.digital.price': { $gte: min, $lte: max } },
//       { 'pricing.physical.price': { $gte: min, $lte: max } },
//     ],
//   });
// };

module.exports = mongoose.model('Book', bookSchema);
