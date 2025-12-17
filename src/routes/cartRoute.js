const router = require('express').Router();
const controller = require('../controllers/cartController');
const { protect } = require('../middlewares/authMiddleware');
const {
  addToCartValidator,
  updateCartItemValidator,
  removeFromCartValidator,
  applyCouponValidator,
} = require('../validators/cartValidator');

// All routes require authentication
router.use(protect);

router.get('/count', controller.getCartCount);

router
  .route('/')
  .get(controller.getCart)
  .post(addToCartValidator, controller.addToCart)
  .delete(controller.clearCart);

router.post('/apply-coupon', applyCouponValidator, controller.applyCoupon);
router.delete('/coupon', controller.removeCoupon);

router
  .route('/:itemId')
  .patch(updateCartItemValidator, controller.updateCartItemQuantity)
  .delete(removeFromCartValidator, controller.removeFromCart);

module.exports = router;
