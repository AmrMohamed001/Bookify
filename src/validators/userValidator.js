const { body, param, query } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

exports.validateUpdateProfile = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('profile.bio')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Bio cannot exceed 500 characters'),

    body('profile.phone')
        .optional()
        .matches(/^[+]?[\d\s\-()]+$/)
        .withMessage('Invalid phone number format'),

    body('profile.avatar.url')
        .optional()
        .isURL()
        .withMessage('Avatar URL must be a valid URL'),

    body('profile.addresses')
        .optional()
        .isArray()
        .withMessage('Addresses must be an array'),

    body('profile.addresses.*.type')
        .optional()
        .isIn(['shipping', 'billing'])
        .withMessage('Address type must be either shipping or billing'),

    body('profile.addresses.*.street')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Street is required for address'),

    body('profile.addresses.*.city')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('City is required for address'),

    body('profile.addresses.*.state')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('State is required for address'),

    body('profile.addresses.*.zipCode')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Zip code is required for address'),

    body('profile.addresses.*.country')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Country is required for address'),

    validatorMiddleware,
];

exports.validateUpdateUser = [
    body('firstName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('First name must be between 2 and 50 characters'),

    body('lastName')
        .optional()
        .trim()
        .isLength({ min: 2, max: 50 })
        .withMessage('Last name must be between 2 and 50 characters'),

    body('role')
        .optional()
        .isIn(['guest', 'user', 'author', 'admin'])
        .withMessage('Invalid role'),

    body('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    validatorMiddleware,
];


exports.validateApplyForAuthor = [
    body('biography')
        .trim()
        .notEmpty()
        .withMessage('Biography is required')
        .isLength({ min: 50, max: 2000 })
        .withMessage('Biography must be between 50 and 2000 characters'),

    validatorMiddleware,
];


exports.validateAuthorAction = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    validatorMiddleware,
];


exports.validateRejectAuthor = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    body('rejectionReason')
        .trim()
        .notEmpty()
        .withMessage('Rejection reason is required')
        .isLength({ min: 10, max: 500 })
        .withMessage('Rejection reason must be between 10 and 500 characters'),

    validatorMiddleware,
];


exports.validateUserId = [
    param('id')
        .isMongoId()
        .withMessage('Invalid user ID'),

    validatorMiddleware,
];

exports.validateGetAllUsers = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('role')
        .optional()
        .isIn(['guest', 'user', 'author', 'admin'])
        .withMessage('Invalid role'),

    query('isActive')
        .optional()
        .isBoolean()
        .withMessage('isActive must be a boolean'),

    query('sort')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Sort field cannot be empty'),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search query must be between 1 and 100 characters'),

    validatorMiddleware,
];
