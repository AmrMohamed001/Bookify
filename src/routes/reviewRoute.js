const router = require('express').Router({ mergeParams: true });
const controller = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  createReviewValidator,
  updateReviewValidator,
  deleteReviewValidator,
} = require('../validators/reviewValidator');

///////////////////////////////////////////////////////////////
// Public routes
router.route('/').get(controller.getreviews);

// Protected routes
router.post('/', protect, createReviewValidator, controller.AddReview);

router
  .route('/:id')
  .get(controller.getReview)
  .patch(
    protect,
    restrictTo('admin', 'user'),
    updateReviewValidator,
    controller.updateReview
  )
  .delete(
    protect,
    restrictTo('admin', 'user'),
    deleteReviewValidator,
    controller.deleteReview
  );

// Mark review as helpful (any logged-in user)
router.post('/:id/helpful', protect, controller.markHelpful);

// Admin moderation
router.patch(
  '/:id/moderate',
  protect,
  restrictTo('admin'),
  controller.moderateReview
);

module.exports = router;
