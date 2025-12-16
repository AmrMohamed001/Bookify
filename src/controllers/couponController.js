const couponService = require('../services/couponService');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all coupons
// @route   GET /api/v1/coupons
// @access  Private (Admin)
exports.getAllCoupons = catchAsync(async (req, res, next) => {
  const result = await couponService.getAllCoupons(req.query);
  res.status(200).json({
    status: 'success',
    results: result.coupons.length,
    pagination: result.pagination,
    data: { coupons: result.coupons },
  });
});

// @desc    Get single coupon
// @route   GET /api/v1/coupons/:id
// @access  Private (Admin)
exports.getCoupon = catchAsync(async (req, res, next) => {
  const coupon = await couponService.getCouponById(req.params.id);
  res.status(200).json({
    status: 'success',
    data: { coupon },
  });
});

// @desc    Create coupon
// @route   POST /api/v1/coupons
// @access  Private (Admin)
exports.createCoupon = catchAsync(async (req, res, next) => {
  const coupon = await couponService.createCoupon(req.body);
  res.status(201).json({
    status: 'success',
    message: 'Coupon created successfully',
    data: { coupon },
  });
});

// @desc    Update coupon
// @route   PATCH /api/v1/coupons/:id
// @access  Private (Admin)
exports.updateCoupon = catchAsync(async (req, res, next) => {
  const coupon = await couponService.updateCoupon(req.params.id, req.body);
  res.status(200).json({
    status: 'success',
    message: 'Coupon updated successfully',
    data: { coupon },
  });
});

// @desc    Delete coupon
// @route   DELETE /api/v1/coupons/:id
// @access  Private (Admin)
exports.deleteCoupon = catchAsync(async (req, res, next) => {
  await couponService.deleteCoupon(req.params.id);
  res.status(200).json({
    status: 'success',
    message: 'Coupon deleted successfully',
    data: null,
  });
});

// @desc    Apply coupon (validate and use)
// @route   POST /api/v1/coupons/apply
// @access  Private (User)
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const coupon = await couponService.applyCoupon(req.body.name);
  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully',
    data: {
      coupon: {
        name: coupon.name,
        discount: coupon.discount,
      },
    },
  });
});
