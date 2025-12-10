const catService = require('../services/CategoryService');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
/////////////////////////////////////////////////////////////////////////////////
// @desc    Get list of categories
// @route   GET /api/v1/categories
// @access  Public
exports.getCategories = catchAsync(async (req, res, next) => {
  const cats = await catService.getAll(req.query);
  res.status(200).json({
    status: 'success',
    length: cats.length,
    page: req.query.page || 1,
    data: { categories: cats },
  });
});
// @desc    Get specific category by id
// @route   GET /api/v1/categories/:id
// @access  Public
exports.getCategory = catchAsync(async (req, res, next) => {
  const cat = await catService.getOne(req.params.id);
  if (!cat) return next(new AppError(404, 'No category found with this id'));
  res.status(200).json({
    status: 'success',
    data: { category: cat },
  });
});
// @desc    Create category
// @route   POST  /api/v1/categories
// @access  Private
exports.AddCategory = catchAsync(async (req, res, next) => {
  const newCategory = await catService.create(req.body);
  res.status(201).json({
    status: 'success',
    data: { newCategory },
  });
});
// @desc    Update specific category
// @route   PATCH /api/v1/categories/:id
// @access  Private
exports.updateCategory = catchAsync(async (req, res, next) => {
  const cat = await catService.update(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    data: { cat },
  });
});

// @desc    Delete specific category
// @route   DELETE /api/v1/categories/:id
// @access  Private
exports.deleteCategory = catchAsync(async (req, res, next) => {
  const cat = await catService.delete(req.params.id);
  res.status(204).json({
    status: 'success',
    data: null,
  });
});
