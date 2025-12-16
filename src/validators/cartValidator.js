const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Book = require('../models/bookModel');

exports.addToCartValidator = [
  check('bookId')
    .notEmpty()
    .withMessage('Book ID is required')
    .isMongoId()
    .withMessage('Invalid book ID format')
    .custom(async bookId => {
      const book = await Book.findById(bookId);
      if (!book) {
        throw new Error('Book not found');
      }
      if (book.status !== 'approved') {
        throw new Error('Book is not available');
      }
      return true;
    }),
  check('format')
    .optional()
    .isIn(['digital', 'physical'])
    .withMessage('Format must be either digital or physical'),
  check('quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be a positive integer'),
  validatorMiddleware,
];

exports.updateCartItemValidator = [
  check('itemId').isMongoId().withMessage('Invalid item ID format'),
  check('quantity')
    .notEmpty()
    .withMessage('Quantity is required')
    .isInt({ min: 0 })
    .withMessage('Quantity must be a non-negative integer'),
  validatorMiddleware,
];

exports.removeFromCartValidator = [
  check('itemId').isMongoId().withMessage('Invalid item ID format'),
  validatorMiddleware,
];

exports.applyCouponValidator = [
  check('coupon')
    .notEmpty()
    .withMessage('Coupon code is required')
    .isLength({ min: 3, max: 30 })
    .withMessage('Invalid coupon code'),
  validatorMiddleware,
];
