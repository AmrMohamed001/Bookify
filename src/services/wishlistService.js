const Wishlist = require('../models/wishlistModel');
const AppError = require('../utils/appError');

exports.getUserWishlist = async (userId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  const filterObj = { user: userId };

  const total = await Wishlist.countDocuments(filterObj);

  const wishlistItems = await Wishlist.find(filterObj)
    .populate(
      'book',
      'title slug coverImage pricing.digital.price stats.averageRating author'
    )
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  return {
    wishlistItems,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.addToWishlist = async (userId, bookId) => {
  const existing = await Wishlist.findOne({ user: userId, book: bookId });
  if (existing) {
    throw new AppError(400, 'Book is already in your wishlist');
  }

  const wishlistItem = await Wishlist.create({
    user: userId,
    book: bookId,
  });

  return wishlistItem.populate(
    'book',
    'title slug coverImage pricing.digital.price stats.averageRating'
  );
};

exports.removeFromWishlist = async (userId, bookId) => {
  const wishlistItem = await Wishlist.findOneAndDelete({
    user: userId,
    book: bookId,
  });

  if (!wishlistItem) {
    throw new AppError(404, 'Book not found in your wishlist');
  }

  return wishlistItem;
};

exports.isInWishlist = async (userId, bookId) => {
  const wishlistItem = await Wishlist.findOne({ user: userId, book: bookId });
  return !!wishlistItem;
};

exports.clearWishlist = async userId => {
  const result = await Wishlist.deleteMany({ user: userId });
  return result.deletedCount;
};

exports.getWishlistCount = async userId => {
  return await Wishlist.countDocuments({ user: userId });
};
