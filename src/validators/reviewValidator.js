const { param, check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');
const Review = require('../models/reviewModel');
exports.getReviewValidator = [
  check('id').isMongoId().withMessage('Invalid Review id format'),
  validatorMiddleware,
];

exports.createReviewValidator = [
  check('reviewText')
    .notEmpty()
    .withMessage('Review text is required')
    .isLength({ min: 3 })
    .withMessage('Too short Review content')
    .isLength({ max: 1000 })
    .withMessage('Too long Review content')
    .custom((val, { req }) => {
      return Review.findOne({
        userId: req.user._id,
        bookId: req.params.bookId,
      }).then(review => {
        if (review)
          return Promise.reject(new Error('you already created review before'));
      });
    }),
  check('rating')
    .isFloat({ min: 1, max: 5 })
    .withMessage('Invalid rating values')
    .notEmpty()
    .withMessage('Review rating is required'),
  validatorMiddleware,
];

exports.updateReviewValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid Review id format')
    .custom((val, { req }) => {
      return Review.findById(val).then(review => {
        if (!review)
          return Promise.reject(new Error('there is no review with this id'));
        if (review) {
          if (review.userId._id.toString() !== req.user._id.toString())
            return Promise.reject(
              new Error('you are not allowed to perform this action')
            );
        }
      });
    }),
  validatorMiddleware,
];

exports.deleteReviewValidator = [
  check('id')
    .isMongoId()
    .withMessage('Invalid Review id format')
    .custom((val, { req }) => {
      if (req.user.role === 'user') {
        return Review.findById(val).then(review => {
          if (!review)
            return Promise.reject(new Error('there is no review with this id'));
          if (review) {
            if (review.userId.toString() !== req.user._id.toString())
              return Promise.reject(
                new Error('you are not allowed to perform this action')
              );
          }
        });
      }
      return true;
    }),
  validatorMiddleware,
];
