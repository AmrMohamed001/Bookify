const router = require('express').Router();
const controller = require('../controllers/wishlistController');
const { protect } = require('../middlewares/authMiddleware');
const {
  addToWishlistValidator,
  bookIdParamValidator,
} = require('../validators/wishlistValidator');

router.use(protect);

router
  .route('/')
  .get(controller.getMyWishlist)
  .post(addToWishlistValidator, controller.addToWishlist)
  .delete(controller.clearWishlist);

router.get('/count', controller.getWishlistCount);

router.get('/check/:bookId', bookIdParamValidator, controller.checkInWishlist);
router.delete('/:bookId', bookIdParamValidator, controller.removeFromWishlist);

module.exports = router;
