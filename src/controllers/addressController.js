const addressService = require('../services/addressService');
const catchAsync = require('../utils/catchAsync');

// @desc    Get all addresses for current user
// @route   GET /api/v1/users/me/addresses
// @query   type: 'shipping' | 'billing' (optional)
// @access  Private
exports.getAddresses = catchAsync(async (req, res, next) => {
  const addresses = await addressService.getUserAddresses(
    req.user._id,
    req.query
  );
  res.status(200).json({
    status: 'success',
    results: addresses.length,
    data: { addresses },
  });
});

// @desc    Get a specific address
// @route   GET /api/v1/users/me/addresses/:id
// @access  Private
exports.getAddress = catchAsync(async (req, res, next) => {
  const address = await addressService.getAddress(req.user._id, req.params.id);
  res.status(200).json({
    status: 'success',
    data: { address },
  });
});

// @desc    Create a new address
// @route   POST /api/v1/users/me/addresses
// @access  Private
exports.createAddress = catchAsync(async (req, res, next) => {
  const address = await addressService.createAddress(req.user._id, req.body);
  res.status(201).json({
    status: 'success',
    message: 'Address created successfully',
    data: { address },
  });
});

// @desc    Update an address
// @route   PATCH /api/v1/users/me/addresses/:id
// @access  Private
exports.updateAddress = catchAsync(async (req, res, next) => {
  const address = await addressService.updateAddress(
    req.user._id,
    req.params.id,
    req.body
  );
  res.status(200).json({
    status: 'success',
    message: 'Address updated successfully',
    data: { address },
  });
});

// @desc    Delete an address
// @route   DELETE /api/v1/users/me/addresses/:id
// @access  Private
exports.deleteAddress = catchAsync(async (req, res, next) => {
  await addressService.deleteAddress(req.user._id, req.params.id);
  res.status(200).json({
    status: 'success',
    message: 'Address deleted successfully',
    data: null,
  });
});

// @desc    Set address as default
// @route   PATCH /api/v1/users/me/addresses/:id/default
// @access  Private
exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const address = await addressService.setDefaultAddress(
    req.user._id,
    req.params.id
  );
  res.status(200).json({
    status: 'success',
    message: 'Address set as default',
    data: { address },
  });
});
