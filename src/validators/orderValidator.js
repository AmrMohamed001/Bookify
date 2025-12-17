const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

exports.createOrderValidator = [
  check('shippingAddressId')
    .notEmpty()
    .withMessage('Shipping address ID is required')
    .isMongoId()
    .withMessage('Invalid shipping address ID format'),
  check('paymentMethod')
    .notEmpty()
    .withMessage('Payment method is required')
    .isIn(['stripe', 'paypal'])
    .withMessage('Payment method must be either stripe or paypal'),
  validatorMiddleware,
];

exports.getOrderValidator = [
  check('id').isMongoId().withMessage('Invalid order ID format'),
  validatorMiddleware,
];

exports.updateFulfillmentValidator = [
  check('id').isMongoId().withMessage('Invalid order ID format'),
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
    .withMessage('Invalid fulfillment status'),
  validatorMiddleware,
];

exports.updateTrackingValidator = [
  check('id').isMongoId().withMessage('Invalid order ID format'),
  check('trackingNumber')
    .notEmpty()
    .withMessage('Tracking number is required')
    .isLength({ min: 5, max: 50 })
    .withMessage('Tracking number must be between 5 and 50 characters'),
  check('carrier')
    .notEmpty()
    .withMessage('Carrier is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Carrier name must be between 2 and 50 characters'),
  validatorMiddleware,
];

exports.cancelOrderValidator = [
  check('id').isMongoId().withMessage('Invalid order ID format'),
  validatorMiddleware,
];
