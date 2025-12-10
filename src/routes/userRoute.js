const router = require('express').Router();
const controller = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
    validateUpdateProfile,
    validateUpdateUser,
    validateApplyForAuthor,
    validateAuthorAction,
    validateRejectAuthor,
    validateUserId,
    validateGetAllUsers,
} = require('../validators/userValidator');

// Current user routes
router.route('/me')
    .get(protect, controller.getMe)
    .patch(protect, validateUpdateProfile, controller.updateMe)
    .delete(protect, controller.deactivateMe);

// Author application
router.post('/apply-author', protect, validateApplyForAuthor, controller.applyForAuthor);

// ==================== ADMIN ROUTES ====================

// User management
router.get('/', protect, restrictTo('admin'), validateGetAllUsers, controller.getAllUsers);
router.route('/:id')
    .get(protect, restrictTo('admin'), validateUserId, controller.getUser)
    .patch(protect, restrictTo('admin'), validateUserId, validateUpdateUser, controller.updateUser)
    .delete(protect, restrictTo('admin'), validateUserId, controller.deleteUser);

// Author management
router.get(
    '/authors/pending',
    protect,
    restrictTo('admin'),
    controller.getPendingAuthors
);
router.patch(
    '/:id/approve-author',
    protect,
    restrictTo('admin'),
    validateAuthorAction,
    controller.approveAuthor
);
router.patch(
    '/:id/reject-author',
    protect,
    restrictTo('admin'),
    validateRejectAuthor,
    controller.rejectAuthor
);

module.exports = router;
