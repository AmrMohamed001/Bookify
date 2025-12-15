const { check } = require('express-validator');
const validatorMiddleware = require('../middlewares/validatorMiddleware');

exports.createAddressValidator = [
  check('type')
    .notEmpty()
    .withMessage('Address type is required')
    .isIn(['shipping', 'billing'])
    .withMessage('Type must be shipping or billing'),
  check('street').notEmpty().withMessage('Street address is required').trim(),
  check('city').notEmpty().withMessage('City is required').trim(),
  check('state').notEmpty().withMessage('State is required').trim(),
  check('zipCode').notEmpty().withMessage('Zip code is required').trim(),
  check('country').notEmpty().withMessage('Country is required').trim(),
  check('label')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Label cannot exceed 50 characters'),
  check('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean'),
  validatorMiddleware,
];

exports.updateAddressValidator = [
  check('id').isMongoId().withMessage('Invalid address ID'),
  check('type')
    .optional()
    .isIn(['shipping', 'billing'])
    .withMessage('Type must be shipping or billing'),
  check('street').optional().trim(),
  check('city').optional().trim(),
  check('state').optional().trim(),
  check('zipCode').optional().trim(),
  check('country').optional().trim(),
  check('label')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Label cannot exceed 50 characters'),
  validatorMiddleware,
];

exports.addressIdValidator = [
  check('id').isMongoId().withMessage('Invalid address ID'),
  validatorMiddleware,
];
