const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const sendEmail = require('../utils/sendEmail');
const AppError = require('../utils/appError');

// ==================== HELPER FUNCTIONS ====================
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

exports.register = async userData => {
  // Create new user
  const user = await User.create({
    email: userData.email,
    password: userData.password,
    passwordConfirm: userData.passwordConfirm,
    firstName: userData.firstName,
    lastName: userData.lastName,
  });

  // Generate email verification token
  const verificationToken = generateToken();
  const hashedToken = hashToken(verificationToken);

  // Store hashed token and expiration (24 hours)
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = Date.now() + 1 * 60 * 60 * 1000; // 24 hours
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `$http://localhost:3000/api/v1/auth/verify-email?token=${verificationToken}`; //TODO: Change to production URL

  // Send verification email
  try {
    await new sendEmail(user, verificationUrl).sendVerifyEmail();
  } catch (error) {
    // If email fails, still return success but log error
    console.error('Failed to send verification email:', error);
  }

  // Remove password from output
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

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save({ validateBeforeSave: false });

  return {
    message: 'Email verified successfully! You can now log in.',
  };
};

/**
 * User login
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} - User, access token, and refresh token
 */
exports.login = async (email, password) => {
  // Check if email and password exist
  if (!email || !password) {
    throw new Error('Please provide email and password');
  }

  // Find user and include password field
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new Error('Incorrect email or password');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new Error(
      'Your account has been deactivated. Please contact support.'
    );
  }

  // Check if email is verified (optional - based on your requirements)
  if (!user.isEmailVerified) {
    throw new Error('Please verify your email before logging in');
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

  // Remove password from output
  user.password = undefined;

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} - New access token
 */
exports.refreshAccessToken = async refreshToken => {
  if (!refreshToken) {
    throw new Error('Refresh token is required');
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
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
    throw new Error('Invalid refresh token');
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user._id);

  // Optional: Implement refresh token rotation for better security
  // Remove old refresh token and generate new one
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

/**
 * User logout
 * @param {String} userId - User ID
 * @param {String} refreshToken - Refresh token to invalidate
 * @returns {Object} - Success message
 */
exports.logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Hash and remove refresh token
  const hashedToken = hashToken(refreshToken);
  user.removeRefreshToken(hashedToken);
  await user.save({ validateBeforeSave: false });

  // TODO: Log logout event for security audit

  return {
    message: 'Logged out successfully',
  };
};

/**
 * Forgot password - send reset email
 * @param {String} email - User email
 * @returns {Object} - Success message
 */
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
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  // Send password reset email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Reset Your Password - Bookify',
      template: 'passwordReset',
      context: {
        firstName: user.firstName,
        url: resetUrl,
      },
    });
  } catch (error) {
    // Clear reset token if email fails
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

/**
 * Reset password
 * @param {String} token - Reset token from email
 * @param {String} newPassword - New password
 * @param {String} passwordConfirm - Password confirmation
 * @returns {Object} - Success message
 */
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
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  // Clear all refresh tokens for security
  user.refreshTokens = [];

  await user.save();

  return {
    message: 'Password reset successful! Please log in with your new password.',
  };
};

/**
 * Resend verification email
 * @param {String} email - User email
 * @returns {Object} - Success message
 */
exports.resendVerificationEmail = async email => {
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error('User not found');
  }

  if (user.isEmailVerified) {
    throw new Error('Email is already verified');
  }

  // Generate new verification token
  const verificationToken = generateToken();
  const hashedToken = hashToken(verificationToken);

  // Update token and expiration
  user.emailVerificationToken = hashedToken;
  user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  await user.save({ validateBeforeSave: false });

  // Create verification URL
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

  // Send verification email
  await sendEmail({
    email: user.email,
    subject: 'Verify Your Email - Bookify',
    template: 'verifyEmail',
    context: {
      firstName: user.firstName,
      url: verificationUrl,
    },
  });

  return {
    message: 'Verification email sent successfully',
  };
};
