const router = require('express').Router();
const controller = require('../controllers/addressController');
const { protect } = require('../middlewares/authMiddleware');
const {
  createAddressValidator,
  updateAddressValidator,
  addressIdValidator,
} = require('../validators/addressValidator');

router.use(protect);

router
  .route('/')
  .get(controller.getAddresses)
  .post(createAddressValidator, controller.createAddress);

router
  .route('/:id')
  .get(addressIdValidator, controller.getAddress)
  .patch(updateAddressValidator, controller.updateAddress)
  .delete(addressIdValidator, controller.deleteAddress);

router.patch('/:id/default', addressIdValidator, controller.setDefaultAddress);

module.exports = router;
