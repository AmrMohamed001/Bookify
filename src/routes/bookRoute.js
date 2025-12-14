const router = require('express').Router();
const controller = require('../controllers/bookController');
const reviewRoute = require('./reviewRoute');
const {
  protect,
  restrictTo,
  restrictToApprovedAuthor,
} = require('../middlewares/authMiddleware');
const {
  uploadBookFiles,
  validateFileSizes,
} = require('../middlewares/uploadMiddleware');
const {
  validateCreateBook,
  validateUpdateBook,
  validateBookId,
  validateRejectBook,
  validateGetAllBooks,
  validateAuthorId,
} = require('../validators/bookValidator');
//////////////////////////////////////////////////////////////////////////////////
router.use('/:bookId/reviews', reviewRoute);
router.get('/', validateGetAllBooks, controller.getAllBooks);
router.get(
  '/my-books',
  protect,
  restrictToApprovedAuthor,
  controller.getMyBooks
);

router.get('/author/:authorId', validateAuthorId, controller.getBooksByAuthor);
router.get(
  '/admin/pending',
  protect,
  restrictTo('admin'),
  controller.getPendingBooks
);

router.get('/:id/preview', validateBookId, controller.getPreview);
router.post(
  '/',
  protect,
  restrictToApprovedAuthor,
  uploadBookFiles,
  validateFileSizes,
  validateCreateBook,
  controller.createBook
);

router
  .route('/:id')
  .get(validateBookId, controller.getBook)
  .patch(
    protect,
    uploadBookFiles,
    validateFileSizes,
    validateBookId,
    validateUpdateBook,
    controller.updateBook
  )
  .delete(protect, validateBookId, controller.deleteBook);

router.patch(
  '/:id/submit',
  protect,
  restrictToApprovedAuthor,
  validateBookId,
  controller.submitForReview
);
router.patch(
  '/:id/approve',
  protect,
  restrictTo('admin'),
  validateBookId,
  controller.approveBook
);
router.patch(
  '/:id/reject',
  protect,
  restrictTo('admin'),
  validateRejectBook,
  controller.rejectBook
);

module.exports = router;
