const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Book = require('../models/bookModel');

exports.addToWishlistValidator = [
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
  validatorMiddleware,
];

exports.bookIdParamValidator = [
  check('bookId').isMongoId().withMessage('Invalid book ID format'),
  validatorMiddleware,
];
