const Review = require('../models/reviewModel');
const AppError = require('../utils/appError');

exports.getAll = async req => {
  let filterObj = { status: 'active' };
  if (req.params.bookId) filterObj.bookId = req.params.bookId;

  // Pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Get total count for pagination info
  const total = await Review.countDocuments(filterObj);

  let query = Review.find(filterObj);

  // Sorting
  if (req.query.sort) {
    query = query.sort(req.query.sort);
  } else {
    query = query.sort('-createdAt');
  }

  // Apply pagination
  query = query.skip(skip).limit(limit);

  const reviews = await query;

  return {
    reviews,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.getOne = async (filter, populateBooks = false) => {
  let query = Review.findOne(filter);
  if (populateBooks) {
    query = query.populate(
      'bookId',
      'title slug coverImage pricing.digital.price'
    );
  }
  const review = await query;
  if (!review) throw new AppError(404, 'Review not found');
  return review;
};

exports.create = async revBody => {
  const existingReview = await Review.findOne({
    bookId: revBody.bookId,
    userId: revBody.userId,
  });

  if (existingReview) {
    throw new AppError(400, 'You have already reviewed this book');
  }

  return await Review.create(revBody);
};

exports.update = async (id, revBody) => {
  const review = await Review.findById(id);
  if (!review) throw new AppError(404, 'Review not found');

  Object.assign(review, revBody);
  await review.save();
  return review;
};

exports.delete = async id => {
  const review = await Review.findByIdAndDelete(id);
  if (!review) throw new AppError(404, 'Review not found');
  return review;
};

exports.markHelpful = async (reviewId, userId) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');

  // Check if user already marked this review as helpful
  if (review.helpfulBy.includes(userId)) {
    throw new AppError(400, 'You have already marked this review as helpful');
  }

  // Check if user is trying to mark their own review
  if (review.userId._id.toString() === userId.toString()) {
    throw new AppError(400, 'You cannot mark your own review as helpful');
  }

  review.helpfulBy.push(userId);
  review.helpfulCount = review.helpfulBy.length;
  await review.save();

  return review;
};

exports.moderateReview = async (reviewId, adminId, action) => {
  const review = await Review.findById(reviewId);
  if (!review) throw new AppError(404, 'Review not found');

  if (action === 'hide') {
    review.status = 'hidden';
  } else if (action === 'delete') {
    review.status = 'deleted';
  } else if (action === 'restore') {
    review.status = 'active';
  } else {
    throw new AppError(400, 'Invalid moderation action');
  }

  review.moderatedBy = adminId;
  review.moderatedAt = new Date();
  await review.save();

  return review;
};
