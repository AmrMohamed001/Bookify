const revService = require('../services/reviewService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

// @desc    Get list of reviews
// @route   GET /api/v1/reviews
// @nested-route   GET /api/v1/books/:bookId/reviews
// @query   sort: -createdAt (default), -rating, -helpfulCount
// @query   page: page number (default 1), limit: items per page (default 10)
// @access  Public
exports.getreviews = catchAsync(async (req, res, next) => {
  const result = await revService.getAll(req);
  res.status(200).json({
    status: 'success',
    results: result.reviews.length,
    pagination: result.pagination,
    data: { reviews: result.reviews },
  });
});

// @desc    Get specific review by id
// @route   GET /api/v1/reviews/:id
// @nested-route   GET /api/v1/books/:bookId/reviews/:id
// @access  Public
exports.getReview = catchAsync(async (req, res, next) => {
  let filterObj = { _id: req.params.id };
  if (req.params.bookId) filterObj.bookId = req.params.bookId;
  const rev = await revService.getOne(filterObj);
  res.status(200).json({
    status: 'success',
    data: { review: rev },
  });
});

// @desc    Create Review
// @route   POST  /api/v1/reviews
// @nested-route   POST /api/v1/books/:bookId/reviews
// @access  Private (User)
exports.AddReview = catchAsync(async (req, res, next) => {
  if (req.params.bookId) req.body.bookId = req.params.bookId;
  if (!req.body.userId) req.body.userId = req.user._id;
  const newReview = await revService.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { review: newReview },
  });
});

// @desc    Update specific Review
// @route   PATCH /api/v1/reviews/:id
// @access  Private (Owner)
exports.updateReview = catchAsync(async (req, res, next) => {
  const rev = await revService.update(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { review: rev },
  });
});

// @desc    Delete specific Review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (Owner/Admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
  await revService.delete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// @desc    Mark review as helpful
// @route   POST /api/v1/reviews/:id/helpful
// @access  Private (User)
exports.markHelpful = catchAsync(async (req, res, next) => {
  const review = await revService.markHelpful(req.params.id, req.user._id);
  res.status(200).json({
    status: 'success',
    message: 'Review marked as helpful',
    data: { review },
  });
});

// @desc    Moderate a review (Admin only)
// @route   PATCH /api/v1/reviews/:id/moderate
// @body    { action: 'hide' | 'delete' | 'restore' }
// @access  Private (Admin)
exports.moderateReview = catchAsync(async (req, res, next) => {
  const { action } = req.body;
  if (!action) {
    return next(
      new AppError(400, 'Please provide an action: hide, delete, or restore')
    );
  }
  const review = await revService.moderateReview(
    req.params.id,
    req.user._id,
    action
  );
  res.status(200).json({
    status: 'success',
    message: `Review ${action}d successfully`,
    data: { review },
  });
});
