const Cart = require('../models/cartModel');
const Book = require('../models/bookModel');
const Coupon = require('../models/couponModel');
const AppError = require('../utils/appError');

const calcTotalCartPrice = cart => {
  let total = 0;
  cart.cartItems.forEach(item => {
    total += item.price * item.quantity;
  });
  cart.totalCartPrice = total;
  cart.totalCartPriceAfterDiscount = undefined;
  cart.coupon = undefined;
  return total;
};

exports.getCart = async userId => {
  let cart = await Cart.findOne({ user: userId }).populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );

  if (!cart) {
    cart = await Cart.create({ user: userId, cartItems: [] });
  }

  return cart;
};

exports.addToCart = async (
  userId,
  bookId,
  format = 'digital',
  quantity = 1
) => {
  const book = await Book.findById(bookId);
  if (!book) {
    throw new AppError(404, 'Book not found');
  }

  if (book.status !== 'approved') {
    throw new AppError(400, 'Book is not available for purchase');
  }

  // Validate format availability and get price
  let price;
  if (format === 'digital') {
    if (!book.pricing?.digital?.isAvailable) {
      throw new AppError(400, 'Digital format is not available for this book');
    }
    price = book.pricing.digital.price;
  } else if (format === 'physical') {
    if (!book.pricing?.physical?.isAvailable) {
      throw new AppError(400, 'Physical format is not available for this book');
    }
    // Check stock for physical books
    if (book.pricing.physical.stock < quantity) {
      throw new AppError(
        400,
        `Insufficient stock. Only ${book.pricing.physical.stock} available.`
      );
    }
    price = book.pricing.physical.price;
  } else {
    throw new AppError(400, 'Invalid format. Must be digital or physical');
  }

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = await Cart.create({
      user: userId,
      cartItems: [
        { book: bookId, format, quantity, price, addedAt: new Date() },
      ],
    });
  } else {
    // Check if same book with same format exists
    const existingItemIndex = cart.cartItems.findIndex(
      item => item.book.toString() === bookId && item.format === format
    );

    if (existingItemIndex > -1) {
      // book exists in cart so update quantity
      const newQuantity = cart.cartItems[existingItemIndex].quantity + quantity;

      // Check stock for physical books
      if (format === 'physical' && book.pricing.physical.stock < newQuantity) {
        throw new AppError(
          400,
          `Insufficient stock. Only ${book.pricing.physical.stock} available.`
        );
      }

      cart.cartItems[existingItemIndex].quantity = newQuantity;
    } else {
      // book doesn't exist in cart so add it
      cart.cartItems.push({
        book: bookId,
        format,
        quantity,
        price,
        addedAt: new Date(),
      });
    }
  }

  calcTotalCartPrice(cart);
  await cart.save();

  return cart.populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );
};

exports.updateCartItemQuantity = async (userId, itemId, quantity) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const itemIndex = cart.cartItems.findIndex(
    item => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    throw new AppError(404, 'Item not found in cart');
  }

  if (quantity <= 0) {
    // remove item from cart
    cart.cartItems.splice(itemIndex, 1);
  } else {
    // update item quantity
    const item = cart.cartItems[itemIndex];

    // Check stock for physical books
    if (item.format === 'physical') {
      const book = await Book.findById(item.book);
      if (book && book.pricing?.physical?.stock < quantity) {
        throw new AppError(
          400,
          `Insufficient stock. Only ${book.pricing.physical.stock} available.`
        );
      }
    }

    cart.cartItems[itemIndex].quantity = quantity;
  }

  calcTotalCartPrice(cart);
  await cart.save();

  return cart.populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );
};

exports.removeFromCart = async (userId, itemId) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  const itemIndex = cart.cartItems.findIndex(
    item => item._id.toString() === itemId
  );

  if (itemIndex === -1) {
    throw new AppError(404, 'Item not found in cart');
  }

  cart.cartItems.splice(itemIndex, 1);
  calcTotalCartPrice(cart);
  await cart.save();

  return cart.populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );
};

exports.clearCart = async userId => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    {
      cartItems: [],
      totalCartPrice: 0,
      totalCartPriceAfterDiscount: undefined,
      coupon: undefined,
    },
    { new: true }
  );

  return cart;
};

exports.applyCouponToCart = async (userId, couponName) => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart || cart.cartItems.length === 0) {
    throw new AppError(400, 'Cart is empty');
  }

  const coupon = await Coupon.findOne({ name: couponName.toUpperCase() });

  if (!coupon) {
    throw new AppError(404, 'Coupon not found');
  }

  if (!coupon.isActive) {
    throw new AppError(400, 'This coupon is no longer active');
  }

  if (new Date() > coupon.expiresIn) {
    throw new AppError(400, 'This coupon has expired');
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError(400, 'This coupon has reached its usage limit');
  }

  const discountAmount = (cart.totalCartPrice * coupon.discount) / 100;
  cart.totalCartPriceAfterDiscount =
    Math.round((cart.totalCartPrice - discountAmount) * 100) / 100;
  cart.coupon = coupon._id;

  await cart.save();

  return cart.populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );
};

exports.removeCouponFromCart = async userId => {
  const cart = await Cart.findOne({ user: userId });

  if (!cart) {
    throw new AppError(404, 'Cart not found');
  }

  cart.totalCartPriceAfterDiscount = undefined;
  cart.coupon = undefined;
  await cart.save();

  return cart.populate(
    'cartItems.book',
    'title slug coverImage pricing stats.averageRating'
  );
};
