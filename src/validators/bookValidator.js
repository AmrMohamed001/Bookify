const { body, param, query } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

exports.validateCreateBook = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),

    body('isbn')
        .trim()
        .notEmpty()
        .withMessage('ISBN is required')
        .matches(/^(?:\d{10}|\d{13})$/)
        .withMessage('ISBN must be 10 or 13 digits'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),

    body('category')
        .notEmpty()
        .withMessage('Category is required')
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('pricing.digital.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Digital price must be a positive number'),

    body('pricing.digital.currency')
        .optional()
        .isIn(['USD', 'EUR', 'GBP'])
        .withMessage('Invalid currency'),

    body('pricing.digital.isAvailable')
        .optional()
        .isBoolean()
        .withMessage('isAvailable must be a boolean'),

    // Physical pricing
    body('pricing.physical.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Physical price must be a positive number'),

    body('pricing.physical.stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),

    body('pricing.physical.isAvailable')
        .optional()
        .isBoolean()
        .withMessage('isAvailable must be a boolean'),

    // Metadata
    body('metadata.genre')
        .optional()
        .isArray()
        .withMessage('Genre must be an array'),

    body('metadata.genre.*')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Each genre must be between 1 and 50 characters'),

    body('metadata.tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

    body('metadata.language')
        .optional()
        .isLength({ min: 2, max: 5 })
        .withMessage('Invalid language code'),

    body('metadata.publisher')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Publisher name too long'),

    body('metadata.publishedDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),

    body('metadata.pageCount')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page count must be a positive integer'),

    validatorMiddleware,
];

exports.validateUpdateBook = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 200 })
        .withMessage('Title must be between 1 and 200 characters'),

    body('description')
        .optional()
        .trim()
        .isLength({ min: 10, max: 5000 })
        .withMessage('Description must be between 10 and 5000 characters'),

    body('category')
        .optional()
        .isMongoId()
        .withMessage('Invalid category ID'),

    body('pricing.digital.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Digital price must be a positive number'),

    body('pricing.physical.price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Physical price must be a positive number'),

    body('pricing.physical.stock')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Stock must be a non-negative integer'),

    body('metadata.genre')
        .optional()
        .isArray()
        .withMessage('Genre must be an array'),

    body('metadata.tags')
        .optional()
        .isArray()
        .withMessage('Tags must be an array'),

    validatorMiddleware,
];

exports.validateBookId = [
    param('id').isMongoId().withMessage('Invalid book ID'),
    validatorMiddleware,
];
exports.validateAuthorId = [
    param('authorId').isMongoId().withMessage('Invalid author ID'),
    validatorMiddleware,
];

exports.validateRejectBook = [
    param('id').isMongoId().withMessage('Invalid book ID'),

    body('rejectionReason')
        .trim()
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters'),

    validatorMiddleware,
];

exports.validateGetAllBooks = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 50 })
        .withMessage('Limit must be between 1 and 50'),

    query('sort')
        .optional()
        .trim()
        .isIn([
            'createdAt',
            '-createdAt',
            'title',
            '-title',
            'pricing.digital.price',
            '-pricing.digital.price',
            'stats.averageRating',
            '-stats.averageRating',
        ])
        .withMessage('Invalid sort field'),

    query('genre')
        .optional()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Invalid genre'),

    query('minPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Min price must be a positive number'),

    query('maxPrice')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Max price must be a positive number'),

    query('format')
        .optional()
        .isIn(['digital', 'physical', 'both'])
        .withMessage('Format must be digital, physical, or both'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

    validatorMiddleware,
];
