const router = require('express').Router();
const controller = require('../controllers/categoryConteroller');
const {
  getCategoryValidator,
  updateCategoryValidator,
  deleteCategoryValidator,
  createCategoryValidator,
} = require('../validators/categoryValidator');
router
  .route('/')
  .post(createCategoryValidator, controller.AddCategory)
  .get(controller.getCategories);
router
  .route('/:id')
  .get(getCategoryValidator, controller.getCategory)
  .patch(updateCategoryValidator, controller.updateCategory)
  .delete(deleteCategoryValidator, controller.deleteCategory);

module.exports = router;
