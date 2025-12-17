const router = require('express').Router();
const controller = require('../controllers/orderController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createOrderValidator,
  getOrderValidator,
  updateFulfillmentValidator,
  updateTrackingValidator,
  cancelOrderValidator,
} = require('../validators/orderValidator');

// All routes require authentication
router.use(protect);

// User routes
router.get('/my-orders', controller.getMyOrders);
router.post('/', createOrderValidator, controller.createOrder);

// Get single order (user can view own orders, admin can view all)
router.get('/:id', getOrderValidator, controller.getOrder);

// Cancel order (user can cancel own pending orders, admin can cancel any)
router.patch('/:id/cancel', cancelOrderValidator, controller.cancelOrder);

// Admin only routes
router.get('/', restrictTo('admin'), controller.getAllOrders);
router.patch(
  '/:id/fulfillment',
  restrictTo('admin'),
  updateFulfillmentValidator,
  controller.updateFulfillmentStatus
);
router.patch(
  '/:id/tracking',
  restrictTo('admin'),
  updateTrackingValidator,
  controller.updateTrackingInfo
);

module.exports = router;
