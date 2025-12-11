const bookService = require('../services/bookService');
const catchAsync = require('../utils/catchAsync');

// @desc    Create a new book
// @route   POST /api/v1/books
// @access  Private/Author
exports.createBook = catchAsync(async (req, res, next) => {
    const book = await bookService.createBook(req.user.id, req.body, req.files);

    res.status(201).json({
        status: 'success',
        data: {
            book,
        },
    });
});

// @desc    Get all approved books
// @route   GET /api/v1/books
// @access  Public
exports.getAllBooks = catchAsync(async (req, res, next) => {
    const result = await bookService.getAllBooks(req.query);

    res.status(200).json({
        status: 'success',
        results: result.books.length,
        pagination: result.pagination,
        data: {
            books: result.books,
        },
    });
});

// @desc    Get a single book
// @route   GET /api/v1/books/:id
// @access  Public
exports.getBook = catchAsync(async (req, res, next) => {
    const book = await bookService.getBookById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: {
            book,
        },
    });
});

// @desc    Get all books by a specific author
// @route   GET /api/v1/books/author/:authorId
// @access  Public
exports.getBooksByAuthor = catchAsync(async (req, res, next) => {
    const result = await bookService.getBooksByAuthorId(req.params.authorId, req.query);

    res.status(200).json({
        status: 'success',
        results: result.books.length,
        pagination: result.pagination,
        data: {
            books: result.books,
        },
    });
});

// @desc    Get author's own books
// @route   GET /api/v1/books/my-books
// @access  Private/Author
exports.getMyBooks = catchAsync(async (req, res, next) => {
    const result = await bookService.getAuthorBooks(req.user.id, req.query);

    res.status(200).json({
        status: 'success',
        results: result.books.length,
        pagination: result.pagination,
        data: {
            books: result.books,
        },
    });
});

// @desc    Update a book
// @route   PATCH /api/v1/books/:id
// @access  Private/Author (own book) or Admin
exports.updateBook = catchAsync(async (req, res, next) => {
    const isAdmin = req.user.role === 'admin';
    const book = await bookService.updateBook(
        req.params.id,
        req.user.id,
        req.body,
        req.files,
        isAdmin
    );

    res.status(200).json({
        status: 'success',
        data: {
            book,
        },
    });
});

// @desc    Delete a book
// @route   DELETE /api/v1/books/:id
// @access  Private/Author (own draft) or Admin
exports.deleteBook = catchAsync(async (req, res, next) => {
    const isAdmin = req.user.role === 'admin';
    await bookService.deleteBook(req.params.id, req.user.id, isAdmin);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// @desc    Submit book for review
// @route   PATCH /api/v1/books/:id/submit
// @access  Private/Author
exports.submitForReview = catchAsync(async (req, res, next) => {
    const book = await bookService.submitForReview(req.params.id, req.user.id);

    res.status(200).json({
        status: 'success',
        message: 'Book submitted for review successfully',
        data: {
            book,
        },
    });
});

// @desc    Get pending books
// @route   GET /api/v1/books/admin/pending
// @access  Private/Admin
exports.getPendingBooks = catchAsync(async (req, res, next) => {
    const result = await bookService.getPendingBooks(req.query);

    res.status(200).json({
        status: 'success',
        results: result.books.length,
        pagination: result.pagination,
        data: {
            books: result.books,
        },
    });
});

// @desc    Approve a book
// @route   PATCH /api/v1/books/:id/approve
// @access  Private/Admin
exports.approveBook = catchAsync(async (req, res, next) => {
    const book = await bookService.approveBook(req.params.id, req.user.id);

    res.status(200).json({
        status: 'success',
        message: 'Book approved successfully',
        data: {
            book,
        },
    });
});

// @desc    Reject a book
// @route   PATCH /api/v1/books/:id/reject
// @access  Private/Admin
exports.rejectBook = catchAsync(async (req, res, next) => {
    const book = await bookService.rejectBook(
        req.params.id,
        req.user.id,
        req.body.rejectionReason
    );

    res.status(200).json({
        status: 'success',
        message: 'Book rejected',
        data: {
            book,
        },
    });
});

// @desc    Get preview URL
// @route   GET /api/v1/books/:id/preview
// @access  Public
exports.getPreview = catchAsync(async (req, res, next) => {
    const preview = await bookService.getPreviewUrl(req.params.id);

    res.status(200).json({
        status: 'success',
        data: preview,
    });
});
