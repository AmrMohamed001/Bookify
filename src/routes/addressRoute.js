const router = require('express').Router();
const controller = require('../controllers/addressController');
const { protect } = require('../middlewares/authMiddleware');
const {
  createAddressValidator,
  updateAddressValidator,
  addressIdValidator,
} = require('../validators/addressValidator');

// All address routes require authentication
router.use(protect);

// @route   GET /api/v1/users/me/addresses
// @desc    Get all addresses
router.get('/', controller.getAddresses);

// @route   POST /api/v1/users/me/addresses
// @desc    Create new address
router.post('/', createAddressValidator, controller.createAddress);

// @route   GET /api/v1/users/me/addresses/:id
// @desc    Get specific address
router.get('/:id', addressIdValidator, controller.getAddress);

// @route   PATCH /api/v1/users/me/addresses/:id
// @desc    Update address
router.patch('/:id', updateAddressValidator, controller.updateAddress);

// @route   DELETE /api/v1/users/me/addresses/:id
// @desc    Delete address
router.delete('/:id', addressIdValidator, controller.deleteAddress);

// @route   PATCH /api/v1/users/me/addresses/:id/default
// @desc    Set address as default
router.patch('/:id/default', addressIdValidator, controller.setDefaultAddress);

module.exports = router;
