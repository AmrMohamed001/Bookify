const mongoose = require('mongoose');
const slugify = require('slugify');

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      unique: [true, 'This name was used before . please enter new name'],
      minLength: [3, 'Too short category name'],
      maxLength: [32, 'Too long category name'],
    },
    slug: String,
    description: {
      type: String,
      maxLength: [200, 'Description cannot exceed 200 characters'],
      trim: true,
    },
    icon: {
      url: String,
      publicId: String, // Cloudinary public ID for deletion
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Generate slug on save
schema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
});

// Regenerate slug on update if name is modified
schema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, { lower: true });
  }
});
module.exports = mongoose.model('Category', schema);
