const router = require('express').Router();
const controller = require('../controllers/userController');
const wishlistRoute = require('./wishlistRoute');
const addressRoute = require('./addressRoute');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  uploadAvatar,
  validateFileSizes,
} = require('../middlewares/uploadMiddleware');
const {
  validateUpdateProfile,
  validateUpdateUser,
  validateApplyForAuthor,
  validateAuthorAction,
  validateRejectAuthor,
  validateUserId,
  validateGetAllUsers,
} = require('../validators/userValidator');
////////////////////////////////////////////////////////////////////
// Nested routes for wishlist and addresses
router.use('/me/wishlist', wishlistRoute);
router.use('/me/addresses', addressRoute);

router
  .route('/me')
  .get(protect, controller.getMe)
  .patch(
    protect,
    uploadAvatar,
    validateFileSizes,
    validateUpdateProfile,
    controller.updateMe
  )
  .delete(protect, controller.deactivateMe);

router.post(
  '/apply-author',
  protect,
  validateApplyForAuthor,
  controller.applyForAuthor
);

// ==================== ADMIN ROUTES ====================
router.use(restrictTo('admin'));
// User management
router.get('/', protect, validateGetAllUsers, controller.getAllUsers);
router
  .route('/:id')
  .get(protect, validateUserId, controller.getUser)
  .patch(protect, validateUserId, validateUpdateUser, controller.updateUser)
  .delete(protect, validateUserId, controller.deleteUser);

// Author management
router.get('/authors/pending', protect, controller.getPendingAuthors);
router.patch(
  '/:id/approve-author',
  protect,
  validateAuthorAction,
  controller.approveAuthor
);
router.patch(
  '/:id/reject-author',
  protect,
  validateRejectAuthor,
  controller.rejectAuthor
);

module.exports = router;
