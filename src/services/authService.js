const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const SendEmail = require('../utils/SendEmail');
const AppError = require('../utils/appError');

// #region ==================== HELPER FUNCTIONS ====================
const generateAccessToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

const generateRefreshToken = userId => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const hashToken = token => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
// #endregion

exports.register = async userData => {
  // Handle both confirmPassword (from forms) and passwordConfirm (from API)
  const passwordConfirm = userData.passwordConfirm || userData.confirmPassword;

  // Create new user
  const user = await User.create({
    email: userData.email,
    password: userData.password,
    passwordConfirm: passwordConfirm,
    firstName: userData.firstName,
    lastName: userData.lastName,
  });

  // Generate email verification token
  const verificationToken = generateToken();
  const hashedToken = hashToken(verificationToken);

  // Store hashed token and expiration (24 hours)
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = Date.now() + 1 * 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${process.env.HOSTURL}/api/v1/auth/verify-email?token=${verificationToken}`;

  // Send verification email
  try {
    await new SendEmail(user, verificationUrl).sendVerifyEmail();
  } catch (error) {
    console.error('Failed to send verification email:', error);
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return {
      user: null,
      message: 'Failed to send verification email',
    };
  }

  user.password = undefined;

  return {
    user,
    message:
      'Registration successful! Please check your email to verify your account.',
  };
};

exports.verifyEmail = async token => {
  // Hash the token to compare with stored hash
  const hashedToken = hashToken(token);

  // Find user with matching token and not expired
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(400, 'Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return {
    message: 'Email verified successfully! You can now log in.',
  };
};

exports.login = async (email, password) => {
  // Check if email and password exist
  if (!email || !password) {
    throw new AppError(400, 'Please provide email and password');
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError(400, 'Incorrect email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError(
      400,
      'Your account has been deactivated. Please contact support.'
    );
  }

  // Check if email is verified (optional - based on your requirements)
  if (!user.isEmailVerified) {
    throw new AppError(400, 'Please verify your email before logging in');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash and store refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  user.addRefreshToken(hashedRefreshToken, refreshTokenExpiry);
  user.updateLastLogin();
  await user.save({ validateBeforeSave: false });

  user.password = undefined;

  return {
    user,
    accessToken,
    refreshToken,
  };
};

exports.refreshAccessToken = async refreshToken => {
  if (!refreshToken) {
    throw new AppError(400, 'Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(
      refreshToken,
      process.env.JWT_REFRESH_SECRET
    );
  } catch (error) {
    throw new AppError(400, 'Invalid or expired refresh token');
  }

  // Hash the refresh token to find in database
  const hashedToken = hashToken(refreshToken);

  // Find user with valid refresh token
  const user = await User.findOne({
    _id: decoded.id,
    'refreshTokens.token': hashedToken,
    'refreshTokens.expiresAt': { $gt: Date.now() },
  });

  if (!user) {
    throw new AppError(400, 'Invalid refresh token');
  }

  const newAccessToken = generateAccessToken(user._id);

  const newRefreshToken = generateRefreshToken(user._id);
  const hashedNewRefreshToken = hashToken(newRefreshToken);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.removeRefreshToken(hashedToken);
  user.addRefreshToken(hashedNewRefreshToken, refreshTokenExpiry);
  await user.save({ validateBeforeSave: false });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

exports.logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new AppError(400, 'User not found');
  }

  const hashedToken = hashToken(refreshToken);
  user.removeRefreshToken(hashedToken);
  await user.save({ validateBeforeSave: false });

  return {
    message: 'Logged out successfully',
  };
};

exports.forgotPassword = async email => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists for security
    return {
      message:
        'If an account exists with this email, a password reset link has been sent.',
    };
  }

  // Generate reset token
  const resetToken = generateToken();
  const hashedToken = hashToken(resetToken);

  // Store hashed token and expiration (1 hour)
  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `$${process.env.HOSTURL}/api/v1/reset-password?token=${resetToken}`;

  // Send verification email
  try {
    await new SendEmail(user, resetUrl).sendResetPassword();
  } catch (error) {
    console.error('Failed to send reset email:', error);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new Error('Failed to send password reset email. Please try again.');
  }

  return {
    message:
      'If an account exists with this email, a password reset link has been sent.',
  };
};

exports.resetPassword = async (token, newPassword, passwordConfirm) => {
  // Hash the token to compare with stored hash
  const hashedToken = hashToken(token);

  // Find user with matching token and not expired
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new Error('Invalid or expired password reset token');
  }

  // Set new password
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  user.passwordChangedAt = Date.now();
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Clear all refresh tokens for security
  user.refreshTokens = [];

  await user.save();

  return {
    message: 'Password reset successful! Please log in with your new password.',
  };
};

exports.updatePassword = async (
  userId,
  currentPassword,
  newPassword,
  passwordConfirm
) => {
  // 1) Get user with password field
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // 2) Check if current password is correct
  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError(401, 'Your current password is incorrect');
  }

  // 3) Check if new password is different from current
  if (currentPassword === newPassword) {
    throw new AppError(
      400,
      'New password must be different from current password'
    );
  }

  // 4) Update password
  user.password = newPassword;
  user.passwordConfirm = passwordConfirm;
  user.passwordChangedAt = Date.now();

  // 5) Clear all refresh tokens for security (force re-login on all devices)
  user.refreshTokens = [];

  await user.save();

  // 6) Generate new tokens for current session
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash and store new refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.addRefreshToken(hashedRefreshToken, refreshTokenExpiry);
  await user.save({ validateBeforeSave: false });

  return {
    message: 'Password updated successfully',
    accessToken,
    refreshToken,
  };
};

exports.resendVerificationEmail = async email => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new AppError(400, 'User not found');
  }

  if (user.isEmailVerified) {
    throw new AppError(400, 'Email is already verified');
  }

  // Generate new verification token
  const verificationToken = generateToken();
  const hashedToken = hashToken(verificationToken);

  // Update token and expiration
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${process.env.HOSTURL}/api/v1/auth/verify-email?token=${verificationToken}`;

  // Send verification email
  try {
    await new SendEmail(user, verificationUrl).sendVerifyEmail();
  } catch (error) {
    console.error('Failed to send verification email:', error);
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return {
      message: 'Failed to send verification email',
    };
  }

  return {
    message:
      'Registration successful! Please check your email to verify your account.',
  };
};

exports.googleAuth = async userFromPassport => {
  // Refetch user to avoid "parallel save" error
  const user = await User.findById(userFromPassport._id);

  if (!user) {
    throw new AppError(404, 'User not found');
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Hash and store refresh token
  const hashedRefreshToken = hashToken(refreshToken);
  const refreshTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  user.addRefreshToken(hashedRefreshToken, refreshTokenExpiry);

  user.lastLoginAt = new Date();

  await user.save({ validateBeforeSave: false });

  user.password = undefined;
  user.refreshTokens = undefined;

  return {
    user,
    accessToken,
    refreshToken,
  };
};
