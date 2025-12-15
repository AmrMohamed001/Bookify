const router = require('express').Router();
const controller = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');
const {
  addToWishlistValidator,
  bookIdParamValidator,
} = require('../validators/wishlistValidator');

// All wishlist routes require authentication
router.use(protect);

// @route   GET /api/v1/users/me/wishlist
// @desc    Get current user's wishlist
router.get('/', controller.getMyWishlist);

// @route   POST /api/v1/users/me/wishlist
// @desc    Add book to wishlist
router.post('/', addToWishlistValidator, controller.addToWishlist);

// @route   DELETE /api/v1/users/me/wishlist
// @desc    Clear entire wishlist
router.delete('/', controller.clearWishlist);

// @route   GET /api/v1/users/me/wishlist/count
// @desc    Get wishlist item count
router.get('/count', controller.getWishlistCount);

// @route   GET /api/v1/users/me/wishlist/check/:bookId
// @desc    Check if book is in wishlist
router.get('/check/:bookId', bookIdParamValidator, controller.checkInWishlist);

// @route   DELETE /api/v1/users/me/wishlist/:bookId
// @desc    Remove book from wishlist
router.delete('/:bookId', bookIdParamValidator, controller.removeFromWishlist);

module.exports = router;
