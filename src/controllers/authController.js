const catchAsync = require('../utils/catchAsync');
const authService = require('../services/authService');
const AppError = require('../utils/appError');
////////////////////////////////////////////////////

// @desc    Register new user
// @route   POST /api/v1/auth/signup
// @access  Public
exports.signup = catchAsync(async (req, res, next) => {
  const result = await authService.register(req.body);

  // Note: We don't auto-login after signup since email verification is required
  // Cookies will be set after email verification

  res.status(201).json({
    status: 'success',
    data: { ...result },
  });
});

// @desc    Verify user email
// @route   GET /api/v1/auth/verify-email
// @access  Public
exports.verifyEmail = catchAsync(async (req, res, next) => {
  const result = await authService.verifyEmail(req.query.token);
  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Resend verification email
// @route   POST /api/v1/auth/resend-verification
// @access  Public
exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
  const result = await authService.resendVerificationEmail(req.body.email);
  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = catchAsync(async (req, res, next) => {
  const result = await authService.login(req.body.email, req.body.password);

  // Set cookies for browser-based requests
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    status: 'success',
    data: {
      ...result,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh-token
// @access  Public
exports.refreshAccessToken = catchAsync(async (req, res, next) => {
  // 1) Get refresh token from body or cookies
  const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

  if (!refreshToken) {
    return next(new AppError(400, 'No refresh token provided'));
  }

  const result = await authService.refreshAccessToken(refreshToken);

  // Set new cookies
  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    status: 'success',
    data: {
      ...result,
    },
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
// @access  Private
exports.logout = catchAsync(async (req, res, next) => {
  const result = await authService.logout(req.user.id, req.body.refreshToken);
  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Forgot password - send reset email
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const result = await authService.forgotPassword(req.body.email);
  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Reset password with token
// @route   POST /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = catchAsync(async (req, res, next) => {
  const result = await authService.resetPassword(
    req.query.token,
    req.body.newPassword,
    req.body.confirmPassword
  );
  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Update password for logged-in user
// @route   PATCH /api/v1/auth/update-password
// @access  Private
exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword, passwordConfirm } = req.body;

  const result = await authService.updatePassword(
    req.user.id,
    currentPassword,
    newPassword,
    passwordConfirm
  );

  res.status(200).json({
    status: 'success',
    ...result,
  });
});

// @desc    Google OAuth callback
// @route   GET /api/v1/auth/google/callback
// @access  Public
exports.googleCallback = catchAsync(async (req, res, next) => {
  if (!req.user) {
    console.error('Google OAuth: No user in request');
    return res.redirect('/login?error=google-auth-failed');
  }

  try {
    const result = await authService.googleAuth(req.user);

    if (!result || !result.accessToken) {
      console.error('Google OAuth: No tokens generated');
      return res.redirect('/login?error=token-generation-failed');
    }

    // Set cookies for authenticated session
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to dashboard after successful Google auth
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect('/login?error=google-auth-error');
  }
});
