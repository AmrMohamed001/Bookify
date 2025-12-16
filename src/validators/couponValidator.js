const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Coupon = require('../models/couponModel');

exports.createCouponValidator = [
  check('name')
    .notEmpty()
    .withMessage('Coupon name is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Coupon name must be between 3 and 30 characters')
    .custom(async name => {
      const existing = await Coupon.findOne({ name: name.toUpperCase() });
      if (existing) {
        throw new Error('Coupon name already exists');
      }
      return true;
    }),
  check('expiresIn')
    .notEmpty()
    .withMessage('Expiry date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom(value => {
      if (new Date(value) <= new Date()) {
        throw new Error('Expiry date must be in the future');
      }
      return true;
    }),
  check('discount')
    .notEmpty()
    .withMessage('Discount is required')
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),
  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  check('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
  validatorMiddleware,
];

exports.updateCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon ID format'),
  check('name')
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage('Coupon name must be between 3 and 30 characters')
    .custom(async (name, { req }) => {
      const existing = await Coupon.findOne({ name: name.toUpperCase() });
      if (existing && existing._id.toString() !== req.params.id) {
        throw new Error('Coupon name already exists');
      }
      return true;
    }),
  check('expiresIn').optional().isISO8601().withMessage('Invalid date format'),
  check('discount')
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage('Discount must be between 1 and 100'),
  check('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  check('usageLimit')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Usage limit must be a positive integer'),
  validatorMiddleware,
];

exports.getCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon ID format'),
  validatorMiddleware,
];

exports.deleteCouponValidator = [
  check('id').isMongoId().withMessage('Invalid coupon ID format'),
  validatorMiddleware,
];

exports.applyCouponValidator = [
  check('name')
    .notEmpty()
    .withMessage('Coupon name is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Invalid coupon name'),
  validatorMiddleware,
];
