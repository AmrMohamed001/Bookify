const orderService = require('../services/orderService');
const catchAsync = require('../utils/catchAsync');

// @desc    Create order from cart
// @route   POST /api/v1/orders
// @access  Private (User)
exports.createOrder = catchAsync(async (req, res, next) => {
  const order = await orderService.createOrder(
    req.user._id,
    req.body.shippingAddressId,
    req.body.paymentMethod
  );

  res.status(201).json({
    status: 'success',
    message: 'Order created successfully',
    data: { order },
  });
});

// @desc    Get logged user's orders
// @route   GET /api/v1/orders/my-orders
// @access  Private (User)
exports.getMyOrders = catchAsync(async (req, res, next) => {
  const result = await orderService.getOrders(req.user._id, req.query);

  res.status(200).json({
    status: 'success',
    results: result.orders.length,
    pagination: result.pagination,
    data: { orders: result.orders },
  });
});

// @desc    Get single order
// @route   GET /api/v1/orders/:id
// @access  Private (User/Admin)
exports.getOrder = catchAsync(async (req, res, next) => {
  const isAdmin = req.user.role === 'admin';
  const order = await orderService.getOrderById(
    req.params.id,
    req.user._id,
    isAdmin
  );

  res.status(200).json({
    status: 'success',
    data: { order },
  });
});

// @desc    Get all orders
// @route   GET /api/v1/orders
// @access  Private (Admin)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const result = await orderService.getAllOrders(req.query);

  res.status(200).json({
    status: 'success',
    results: result.orders.length,
    pagination: result.pagination,
    data: { orders: result.orders },
  });
});

// @desc    Update order fulfillment status
// @route   PATCH /api/v1/orders/:id/fulfillment
// @access  Private (Admin)
exports.updateFulfillmentStatus = catchAsync(async (req, res, next) => {
  const order = await orderService.updateFulfillmentStatus(
    req.params.id,
    req.body.status,
    req.user._id
  );

  res.status(200).json({
    status: 'success',
    message: `Order status updated to '${req.body.status}'`,
    data: { order },
  });
});

// @desc    Update order tracking info
// @route   PATCH /api/v1/orders/:id/tracking
// @access  Private (Admin)
exports.updateTrackingInfo = catchAsync(async (req, res, next) => {
  const order = await orderService.updateTrackingInfo(
    req.params.id,
    req.body.trackingNumber,
    req.body.carrier
  );

  res.status(200).json({
    status: 'success',
    message: 'Tracking info updated',
    data: { order },
  });
});

// @desc    Cancel order
// @route   PATCH /api/v1/orders/:id/cancel
// @access  Private (User/Admin)
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const isAdmin = req.user.role === 'admin';
  const order = await orderService.cancelOrder(
    req.params.id,
    req.user._id,
    isAdmin
  );

  res.status(200).json({
    status: 'success',
    message: 'Order cancelled successfully',
    data: { order },
  });
});
