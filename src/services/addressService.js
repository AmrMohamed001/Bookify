const User = require('../models/userModel');
const AppError = require('../utils/appError');

/**
 * Get all addresses for a user
 */
exports.getUserAddresses = async (userId, query = {}) => {
  const user = await User.findById(userId).select('profile.addresses');
  if (!user) throw new AppError(404, 'User not found');

  let addresses = user.profile.addresses || [];

  // Filter by type if provided
  if (query.type) {
    addresses = addresses.filter(addr => addr.type === query.type);
  }

  // Sort: default first, then by creation date
  addresses.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return 0;
  });

  return addresses;
};

/**
 * Get a specific address by ID
 */
exports.getAddress = async (userId, addressId) => {
  const user = await User.findById(userId).select('profile.addresses');
  if (!user) throw new AppError(404, 'User not found');

  const address = user.profile.addresses.id(addressId);
  if (!address) throw new AppError(404, 'Address not found');

  return address;
};

/**
 * Create a new address
 */
exports.createAddress = async (userId, addressData) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  // Initialize addresses array if not exists
  if (!user.profile.addresses) {
    user.profile.addresses = [];
  }

  // Check max addresses limit
  if (user.profile.addresses.length >= 10) {
    throw new AppError(400, 'Maximum 10 addresses allowed');
  }

  // If this is first address of this type, make it default
  const existingOfType = user.profile.addresses.filter(
    addr => addr.type === addressData.type
  );
  if (existingOfType.length === 0) {
    addressData.isDefault = true;
  }

  // If setting as default, unset others of same type
  if (addressData.isDefault) {
    user.profile.addresses.forEach(addr => {
      if (addr.type === addressData.type) {
        addr.isDefault = false;
      }
    });
  }

  user.profile.addresses.push(addressData);
  await user.save({ validateModifiedOnly: true });

  return user.profile.addresses[user.profile.addresses.length - 1];
};

/**
 * Update an address
 */
exports.updateAddress = async (userId, addressId, updateData) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const address = user.profile.addresses.id(addressId);
  if (!address) throw new AppError(404, 'Address not found');

  // If setting as default, unset others of same type
  if (updateData.isDefault) {
    const targetType = updateData.type || address.type;
    user.profile.addresses.forEach(addr => {
      if (addr.type === targetType && addr._id.toString() !== addressId) {
        addr.isDefault = false;
      }
    });
  }

  // Update fields
  Object.keys(updateData).forEach(key => {
    if (key !== '_id' && key !== 'user') {
      address[key] = updateData[key];
    }
  });

  await user.save({ validateModifiedOnly: true });
  return address;
};

/**
 * Delete an address
 */
exports.deleteAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const address = user.profile.addresses.id(addressId);
  if (!address) throw new AppError(404, 'Address not found');

  const wasDefault = address.isDefault;
  const addressType = address.type;

  // Remove using pull
  user.profile.addresses.pull(addressId);

  // If deleted was default, make another one default
  if (wasDefault) {
    const nextOfType = user.profile.addresses.find(
      addr => addr.type === addressType
    );
    if (nextOfType) {
      nextOfType.isDefault = true;
    }
  }

  await user.save({ validateModifiedOnly: true });
  return address;
};

/**
 * Set an address as default
 */
exports.setDefaultAddress = async (userId, addressId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, 'User not found');

  const address = user.profile.addresses.id(addressId);
  if (!address) throw new AppError(404, 'Address not found');

  // Unset all others of same type
  user.profile.addresses.forEach(addr => {
    if (addr.type === address.type) {
      addr.isDefault = addr._id.toString() === addressId;
    }
  });

  await user.save({ validateModifiedOnly: true });
  return address;
};

/**
 * Get default address by type
 */
exports.getDefaultAddress = async (userId, type) => {
  const user = await User.findById(userId).select('profile.addresses');
  if (!user) throw new AppError(404, 'User not found');

  const address = user.profile.addresses.find(
    addr => addr.type === type && addr.isDefault
  );
  return address || null;
};
