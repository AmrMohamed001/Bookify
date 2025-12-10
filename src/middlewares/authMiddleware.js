const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token from header
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError(401, 'You are not logged in. Please log in to get access.')
    );
  }

  // 2) Verify token
  let decoded;
  try {
    decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError(401, 'Invalid token. Please log in again.'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(401, 'Your token has expired. Please log in again.')
      );
    }
    return next(new AppError(401, 'Authentication failed.'));
  }

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(401, 'The user belonging to this token no longer exists.')
    );
  }

  // 4) Check if user is active
  if (!currentUser.isActive) {
    return next(
      new AppError(
        401,
        'Your account has been deactivated. Please contact support.'
      )
    );
  }

  // 5) Check if email is verified
  if (!currentUser.isEmailVerified) {
    return next(
      new AppError(
        401,
        'Please verify your email before accessing this resource.'
      )
    );
  }

  // 6) Check if user changed password after the token was issued
  if (currentUser.checkPasswordChanged(decoded.iat))
    return next(new AppError('user changed password,try again !', 401));

  // 7) Grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles is an array: ['admin', 'author']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(403, 'You do not have permission to perform this action.')
      );
    }
    next();
  };
};

exports.restrictToApprovedAuthor = (req, res, next) => {
  if (req.user.role !== 'author' || !req.user.authorInfo.isApproved) {
    return next(
      new AppError(
        403,
        'Only approved authors can perform this action. Please wait for admin approval.'
      )
    );
  }
  next();
};
