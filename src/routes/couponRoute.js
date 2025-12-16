const router = require('express').Router();
const controller = require('../controllers/couponController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createCouponValidator,
  updateCouponValidator,
  getCouponValidator,
  deleteCouponValidator,
  applyCouponValidator,
} = require('../validators/couponValidator');

// Apply coupon route - accessible by authenticated users
router.post('/apply', protect, applyCouponValidator, controller.applyCoupon);

// Admin-only routes
router
  .route('/')
  .get(protect, restrictTo('admin'), controller.getAllCoupons)
  .post(
    protect,
    restrictTo('admin'),
    createCouponValidator,
    controller.createCoupon
  );

router
  .route('/:id')
  .get(protect, restrictTo('admin'), getCouponValidator, controller.getCoupon)
  .patch(
    protect,
    restrictTo('admin'),
    updateCouponValidator,
    controller.updateCoupon
  )
  .delete(
    protect,
    restrictTo('admin'),
    deleteCouponValidator,
    controller.deleteCoupon
  );

module.exports = router;
