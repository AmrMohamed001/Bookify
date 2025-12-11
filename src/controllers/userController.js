const userService = require('../services/userService');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private/Admin
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const result = await userService.getAllUsers(req.query);

    res.status(200).json({
        status: 'success',
        results: result.users.length,
        pagination: result.pagination,
        data: {
            users: result.users,
        },
    });
});

// @desc    Get single user by ID
// @route   GET /api/v1/users/:id
// @access  Private/Admin
exports.getUser = catchAsync(async (req, res, next) => {
    const user = await userService.getUserById(req.params.id);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// @desc    Get current user profile
// @route   GET /api/v1/users/me
// @access  Private
exports.getMe = catchAsync(async (req, res, next) => {
    const user = await userService.getCurrentUser(req.user.id);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// @desc    Update current user profile
// @route   PATCH /api/v1/users/me
// @access  Private
exports.updateMe = catchAsync(async (req, res, next) => {
    const user = await userService.updateProfile(req.user.id, req.body, req.file);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// @desc    Update user by admin
// @route   PATCH /api/v1/users/:id
// @access  Private/Admin
exports.updateUser = catchAsync(async (req, res, next) => {
    const user = await userService.updateUser(req.params.id, req.body);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// @desc    Deactivate current user account
// @route   DELETE /api/v1/users/me
// @access  Private
exports.deactivateMe = catchAsync(async (req, res, next) => {
    await userService.deactivateUser(req.user.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// @desc    Delete user permanently
// @route   DELETE /api/v1/users/:id
// @access  Private/Admin
exports.deleteUser = catchAsync(async (req, res, next) => {
    await userService.deleteUser(req.params.id);

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// @desc    Apply to become an author
// @route   POST /api/v1/users/apply-author
// @access  Private
exports.applyForAuthor = catchAsync(async (req, res, next) => {
    const result = await userService.applyForAuthor(req.user.id, req.body);

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            user: result.user,
        },
    });
});

// @desc    Approve author application
// @route   PATCH /api/v1/users/:id/approve-author
// @access  Private/Admin
exports.approveAuthor = catchAsync(async (req, res, next) => {
    const result = await userService.approveAuthor(req.params.id, req.user.id);

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            user: result.user,
        },
    });
});

// @desc    Reject author application
// @route   PATCH /api/v1/users/:id/reject-author
// @access  Private/Admin
exports.rejectAuthor = catchAsync(async (req, res, next) => {
    const result = await userService.rejectAuthor(
        req.params.id,
        req.body.rejectionReason
    );

    res.status(200).json({
        status: 'success',
        message: result.message,
        data: {
            user: result.user,
        },
    });
});

// @desc    Get pending author applications
// @route   GET /api/v1/users/authors/pending
// @access  Private/Admin
exports.getPendingAuthors = catchAsync(async (req, res, next) => {
    const authors = await userService.getPendingAuthors();

    res.status(200).json({
        status: 'success',
        results: authors.length,
        data: {
            authors,
        },
    });
});
