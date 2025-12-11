const router = require('express').Router();
const controller = require('../controllers/categoryConteroller');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const {
  uploadIcon,
  validateFileSizes,
} = require('../middlewares/uploadMiddleware');
const {
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  createCategoryValidator,
} = require('../validators/categoryValidator');
///////////////////////////////////////////////////////////////
router
  .route('/')
  .get(controller.getCategories)
  .post(
    protect,
    restrictTo('admin'),
    uploadIcon,
    validateFileSizes,
    createCategoryValidator,
    controller.AddCategory
  );

router
  .route('/:id')
  .get(getCategoryValidator, controller.getCategory)
  .patch(
    protect,
    restrictTo('admin'),
    uploadIcon,
    validateFileSizes,
    updateCategoryValidator,
    controller.updateCategory
  )
  .delete(
    protect,
    restrictTo('admin'),
    deleteCategoryValidator,
    controller.deleteCategory
  );

module.exports = router;
