const Coupon = require('../models/couponModel');
const AppError = require('../utils/appError');

exports.getAllCoupons = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filterObj = {};
  if (query.isActive !== undefined) {
    filterObj.isActive = query.isActive === 'true';
  }

  const total = await Coupon.countDocuments(filterObj);
  const coupons = await Coupon.find(filterObj)
    .sort('-createdAt')
    .skip(skip)
    .limit(limit);

  return {
    coupons,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

exports.getCouponById = async id => {
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }
  return coupon;
};

exports.getCouponByName = async name => {
  const coupon = await Coupon.findOne({ name: name.toUpperCase() });
  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }
  return coupon;
};

exports.createCoupon = async couponData => {
  const coupon = await Coupon.create(couponData);
  return coupon;
};

exports.updateCoupon = async (id, updateData) => {
  const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });

  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }

  return coupon;
};

exports.deleteCoupon = async id => {
  const coupon = await Coupon.findByIdAndDelete(id);

  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }

  return coupon;
};

exports.applyCoupon = async name => {
  const coupon = await Coupon.findOne({ name: name.toUpperCase() });

  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }

  // Check if coupon is active
  if (!coupon.isActive) {
    throw new AppError(400, 'This coupon is no longer active');
  }

  // Check if coupon has expired
  if (new Date() > coupon.expiresIn) {
    throw new AppError(400, 'This coupon has expired');
  }

  // Check usage limit
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(400, 'This coupon has reached its usage limit');
  }

  // Increment usage count
  coupon.usedCount += 1;
  await coupon.save();

  return coupon;
};
