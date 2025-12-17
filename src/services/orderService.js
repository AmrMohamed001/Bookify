const mongoose = require('mongoose');
const Order = require('../models/orderModel');
const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');
const User = require('../models/userModel');
const generateOrderNumber = require('../utils/generateOrderNumber');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/Api-Features');

exports.createOrder = async (
  userId,
  shippingAddressId,
  paymentMethod = 'stripe'
) => {
  // Get user with addresses
  const user = await User.findById(userId).select('profile.addresses');
  if (!user) throw new AppError(404, 'User not found');

  // Validate shipping address
  const shippingAddress = user.profile.addresses.id(shippingAddressId);
  if (!shippingAddress) throw new AppError(404, 'Shipping address not found');
  if (shippingAddress.type !== 'shipping') {
    throw new AppError(400, 'Please provide a shipping address');
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: userId }).populate(
    'cartItems.book',
    'title pricing'
  );
  if (!cart || cart.cartItems.length === 0) {
    throw new AppError(400, 'Cart is empty');
  }

  // Validate stock for physical books and prepare order items
  const orderItems = [];
  for (const item of cart.cartItems) {
    const book = await Book.findById(item.book._id);
    if (!book) {
      throw new AppError(404, `Book not found: ${item.book.title}`);
    }

    if (item.format === 'physical') {
      if (book.pricing?.physical?.stock < item.quantity) {
        throw new AppError(
          400,
          `Insufficient stock for "${book.title}". Only ${book.pricing.physical.stock} available.`
        );
      }
    }

    orderItems.push({
      bookId: book._id,
      title: book.title,
      format: item.format,
      price: item.price,
      quantity: item.quantity,
    });
  }

  // Calculate pricing
  const subtotal = cart.totalCartPrice;
  const tax = Math.round(subtotal * 0.1 * 100) / 100; // 10% tax
  const hasPhysical = orderItems.some(item => item.format === 'physical');
  const shipping = hasPhysical ? 5.99 : 0; // Flat rate for physical items
  const discount = cart.totalCartPriceAfterDiscount
    ? subtotal - cart.totalCartPriceAfterDiscount
    : 0;
  const total = Math.round((subtotal + tax + shipping - discount) * 100) / 100;

  // Create order
  const order = await Order.create({
    orderNumber: generateOrderNumber(),
    userId,
    items: orderItems,
    pricing: {
      subtotal,
      tax,
      shipping,
      discount,
      total,
    },
    shippingAddress: {
      street: shippingAddress.street,
      city: shippingAddress.city,
      state: shippingAddress.state,
      zipCode: shippingAddress.zipCode,
      country: shippingAddress.country,
    },
    payment: {
      method: paymentMethod,
      transactionId: `TXN-${Date.now()}`, // Placeholder - will be replaced by actual payment provider
      status: 'pending',
    },
    fulfillment: {
      status: 'pending',
    },
  });

  // Update stock and sales stats using bulkWrite for efficiency
  const bulkOps = [];

  for (const item of orderItems) {
    // First operation: increment sales and decrement stock
    const updateOp = {
      updateOne: {
        filter: { _id: item.bookId },
        update: { $inc: { 'stats.totalSales': item.quantity } },
      },
    };

    if (item.format === 'physical') {
      updateOp.updateOne.update.$inc['pricing.physical.stock'] = -item.quantity;
    }

    bulkOps.push(updateOp);

    // Second operation: mark as unavailable if stock will become 0 or less
    // We need to fetch the current stock first to determine this
    if (item.format === 'physical') {
      const book = await Book.findById(item.bookId).select(
        'pricing.physical.stock'
      );
      if (book && book.pricing?.physical?.stock <= item.quantity) {
        bulkOps.push({
          updateOne: {
            filter: { _id: item.bookId },
            update: { $set: { 'pricing.physical.isAvailable': false } },
          },
        });
      }
    }
  }

  if (bulkOps.length > 0) {
    await Book.bulkWrite(bulkOps);
  }

  // Clear cart
  await Cart.findOneAndUpdate(
    { user: userId },
    {
      cartItems: [],
      totalCartPrice: 0,
      totalCartPriceAfterDiscount: undefined,
      coupon: undefined,
    }
  );

  return order;
};

/**
 * Get user's orders with pagination
 */
exports.getOrders = async (userId, query) => {
  const filter = { userId };
  const baseQuery = Order.find(filter).sort('-createdAt');
  const total = await Order.countDocuments(filter);

  const features = new ApiFeatures(query, baseQuery).paging(total);
  const orders = await features.query;

  return {
    orders,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

/**
 * Get single order by ID (validates ownership)
 */
exports.getOrderById = async (orderId, userId, isAdmin = false) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  // Check ownership if not admin
  if (!isAdmin && order.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'You do not have permission to view this order');
  }

  return order;
};

/**
 * Get all orders (Admin only) with filters and pagination
 */
exports.getAllOrders = async query => {
  const filter = {};

  // Filter by payment status
  if (query.paymentStatus) {
    filter['payment.status'] = query.paymentStatus;
  }

  // Filter by fulfillment status
  if (query.fulfillmentStatus) {
    filter['fulfillment.status'] = query.fulfillmentStatus;
  }

  // Filter by user
  if (query.userId) {
    filter.userId = query.userId;
  }

  const baseQuery = Order.find(filter).sort('-createdAt');
  const total = await Order.countDocuments(filter);

  const features = new ApiFeatures(query, baseQuery).paging(total);
  const orders = await features.query;

  return {
    orders,
    pagination: {
      page: parseInt(query.page) || 1,
      limit: parseInt(query.limit) || 10,
      total,
      pages: Math.ceil(total / (parseInt(query.limit) || 10)),
    },
  };
};

/**
 * Update order fulfillment status (Admin only)
 */
exports.updateFulfillmentStatus = async (orderId, status, adminId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  const validTransitions = {
    pending: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  const currentStatus = order.fulfillment.status;
  if (!validTransitions[currentStatus].includes(status)) {
    throw new AppError(
      400,
      `Cannot transition from '${currentStatus}' to '${status}'`
    );
  }

  order.fulfillment.status = status;

  // Set timestamps based on status
  if (status === 'shipped') {
    order.fulfillment.shippedAt = new Date();
  } else if (status === 'delivered') {
    order.fulfillment.deliveredAt = new Date();
  }

  await order.save();
  return order;
};

/**
 * Update fulfillment tracking info (Admin only)
 */
exports.updateTrackingInfo = async (orderId, trackingNumber, carrier) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  order.fulfillment.trackingNumber = trackingNumber;
  order.fulfillment.carrier = carrier;

  await order.save();
  return order;
};

/**
 * Update payment status (for webhooks)
 */
exports.updatePaymentStatus = async (orderId, status, transactionId) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  order.payment.status = status;
  if (transactionId) {
    order.payment.transactionId = transactionId;
  }
  if (status === 'completed') {
    order.payment.paidAt = new Date();
  }

  await order.save();
  return order;
};

/**
 * Cancel order
 */
exports.cancelOrder = async (orderId, userId, isAdmin = false) => {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  // Check ownership if not admin
  if (!isAdmin && order.userId.toString() !== userId.toString()) {
    throw new AppError(403, 'You do not have permission to cancel this order');
  }

  // Can only cancel pending orders
  if (order.fulfillment.status !== 'pending') {
    throw new AppError(400, 'Only pending orders can be cancelled');
  }

  // Restore stock for physical books and decrement sales stats using bulkWrite
  const bulkOps = order.items.map(item => {
    const update = { $inc: { 'stats.totalSales': -item.quantity } };

    if (item.format === 'physical') {
      update.$inc['pricing.physical.stock'] = item.quantity;
      // Also mark as available again since we're restoring stock
      update.$set = { 'pricing.physical.isAvailable': true };
    }

    return {
      updateOne: {
        filter: { _id: item.bookId },
        update,
      },
    };
  });

  if (bulkOps.length > 0) {
    await Book.bulkWrite(bulkOps);
  }

  order.fulfillment.status = 'cancelled';
  await order.save();

  return order;
};
