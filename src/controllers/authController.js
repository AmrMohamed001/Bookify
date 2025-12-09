const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');
////////////////////////////////////////////////////

exports.signup = catchAsync(async (req, res, next) => {
  const { user, message } = await authService.register(req.body);
  res.status(201).json({
    status: 'success',
    message,
    data: { user },
  });
});
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const { message } = await authService.verifyEmail(req.query.token);
  res.status(200).json({
    status: 'success',
    message,
  });
});
exports.login = catchAsync(async (req, res, next) => {});
exports.logout = catchAsync(async (req, res, next) => {});
exports.forgotPassword = catchAsync(async (req, res, next) => {});
exports.resetPassword = catchAsync(async (req, res, next) => {});
exports.updatePassword = catchAsync(async (req, res, next) => {});
