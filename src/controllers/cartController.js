const cartService = require('../services/cartService');
const catchAsync = require('../utils/catchAsync');

// @desc    Get logged user's cart
// @route   GET /api/v1/cart
// @access  Private (User)
exports.getCart = catchAsync(async (req, res, next) => {
  const cart = await cartService.getCart(req.user._id);
  res.status(200).json({
    status: 'success',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});

// @desc    Add item to cart
// @route   POST /api/v1/cart
// @body    { bookId: "...", quantity: 1 }
// @access  Private (User)
exports.addToCart = catchAsync(async (req, res, next) => {
  const cart = await cartService.addToCart(
    req.user._id,
    req.body.bookId,
    req.body.format,
    req.body.quantity
  );
  res.status(200).json({
    status: 'success',
    message: 'Item added to cart',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});

// @desc    Update cart item quantity
// @route   PATCH /api/v1/cart/:itemId
// @body    { quantity: 2 }
// @access  Private (User)
exports.updateCartItemQuantity = catchAsync(async (req, res, next) => {
  const cart = await cartService.updateCartItemQuantity(
    req.user._id,
    req.params.itemId,
    req.body.quantity
  );
  res.status(200).json({
    status: 'success',
    message: 'Cart updated',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});

// @desc    Remove item from cart
// @route   DELETE /api/v1/cart/:itemId
// @access  Private (User)
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const cart = await cartService.removeFromCart(
    req.user._id,
    req.params.itemId
  );
  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});

// @desc    Clear cart
// @route   DELETE /api/v1/cart
// @access  Private (User)
exports.clearCart = catchAsync(async (req, res, next) => {
  await cartService.clearCart(req.user._id);
  res.status(200).json({
    status: 'success',
    message: 'Cart cleared',
    data: null,
  });
});

// @desc    Apply coupon to cart
// @route   POST /api/v1/cart/apply-coupon
// @body    { coupon: "COUPON_NAME" }
// @access  Private (User)
exports.applyCoupon = catchAsync(async (req, res, next) => {
  const cart = await cartService.applyCouponToCart(
    req.user._id,
    req.body.coupon
  );
  res.status(200).json({
    status: 'success',
    message: 'Coupon applied successfully',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});

// @desc    Remove coupon from cart
// @route   DELETE /api/v1/cart/coupon
// @access  Private (User)
exports.removeCoupon = catchAsync(async (req, res, next) => {
  const cart = await cartService.removeCouponFromCart(req.user._id);
  res.status(200).json({
    status: 'success',
    message: 'Coupon removed',
    numOfCartItems: cart.cartItems.length,
    data: { cart },
  });
});
