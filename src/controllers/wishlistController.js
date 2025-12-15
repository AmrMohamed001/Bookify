const wishlistService = require('../services/wishlistService');
const catchAsync = require('../utils/catchAsync');

// @desc    Get current user's wishlist
// @route   GET /api/v1/users/me/wishlist
// @access  Private (User)
exports.getMyWishlist = catchAsync(async (req, res, next) => {
  const result = await wishlistService.getUserWishlist(req.user._id, req.query);
  res.status(200).json({
    status: 'success',
    results: result.wishlistItems.length,
    pagination: result.pagination,
    data: { wishlist: result.wishlistItems },
  });
});

// @desc    Add book to wishlist
// @route   POST /api/v1/users/me/wishlist
// @body    { bookId: "..." }
// @access  Private (User)
exports.addToWishlist = catchAsync(async (req, res, next) => {
  const wishlistItem = await wishlistService.addToWishlist(
    req.user._id,
    req.body.bookId
  );
  res.status(201).json({
    status: 'success',
    message: 'Book added to wishlist',
    data: { wishlistItem },
  });
});

// @desc    Remove book from wishlist
// @route   DELETE /api/v1/users/me/wishlist/:bookId
// @access  Private (User)
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  await wishlistService.removeFromWishlist(req.user._id, req.params.bookId);
  res.status(200).json({
    status: 'success',
    message: 'Book removed from wishlist',
    data: null,
  });
});

// @desc    Check if book is in wishlist
// @route   GET /api/v1/users/me/wishlist/check/:bookId
// @access  Private (User)
exports.checkInWishlist = catchAsync(async (req, res, next) => {
  const isInWishlist = await wishlistService.isInWishlist(
    req.user._id,
    req.params.bookId
  );
  res.status(200).json({
    status: 'success',
    data: { isInWishlist },
  });
});

// @desc    Clear entire wishlist
// @route   DELETE /api/v1/users/me/wishlist
// @access  Private (User)
exports.clearWishlist = catchAsync(async (req, res, next) => {
  const deletedCount = await wishlistService.clearWishlist(req.user._id);
  res.status(200).json({
    status: 'success',
    message: `Removed ${deletedCount} items from wishlist`,
    data: null,
  });
});

// @desc    Get wishlist count
// @route   GET /api/v1/users/me/wishlist/count
// @access  Private (User)
exports.getWishlistCount = catchAsync(async (req, res, next) => {
  const count = await wishlistService.getWishlistCount(req.user._id);
  res.status(200).json({
    status: 'success',
    data: { count },
  });
});
