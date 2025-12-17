const express = require('express');
const { protect } = require('../middlewares/authMiddleware');
const Book = require('../models/bookModel');

const router = express.Router();

/////////////////////////////////////////////////////////////////
// PUBLIC ROUTES
/////////////////////////////////////////////////////////////////

// Homepage
router.get('/', async (req, res) => {
  try {
    // Fetch featured/latest books
    const featuredBooks = await Book.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title author coverImage pricing stats');

    res.render('index', {
      title: 'Home - Bookify',
      user: req.user,
      cartCount: req.user?.cart?.length || 0,
      featuredBooks: featuredBooks || [],
      categories: ['Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography'],
    });
  } catch (error) {
    console.error('Error fetching featured books:', error);
    res.render('index', {
      title: 'Home - Bookify',
      user: req.user,
      cartCount: req.user?.cart?.length || 0,
      featuredBooks: [],
      categories: ['Fiction', 'Mystery', 'Romance', 'Sci-Fi', 'Biography'],
    });
  }
});

// Login
router.get('/login', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('login', { title: 'Login - Bookify' });
});

// Register
router.get('/register', (req, res) => {
  if (req.user) return res.redirect('/');
  res.render('register', { title: 'Create Account - Bookify' });
});

// Browse Books
router.get('/books', async (req, res) => {
  try {
    // Get query parameters for filtering and sorting
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { 'author.name': { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }
    if (req.query.format) {
      if (req.query.format === 'digital') {
        filter['pricing.digital.isAvailable'] = true;
      } else if (req.query.format === 'physical') {
        filter['pricing.physical.isAvailable'] = true;
      }
    }

    // Build sort object
    let sortBy = {};
    switch (req.query.sort) {
      case 'price-low':
        sortBy = { 'pricing.digital.price': 1 };
        break;
      case 'price-high':
        sortBy = { 'pricing.digital.price': -1 };
        break;
      case 'rating':
        sortBy = { 'stats.averageRating': -1 };
        break;
      case 'popular':
        sortBy = { 'stats.reviewCount': -1 };
        break;
      case 'newest':
      default:
        sortBy = { createdAt: -1 };
    }

    // Fetch books
    const books = await Book.find(filter)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .select('title author coverImage pricing stats');

    // Get total count for pagination
    const totalBooks = await Book.countDocuments(filter);
    const totalPages = Math.ceil(totalBooks / limit);

    // Get genres for filter
    const genres = await Book.distinct('genre');

    res.render('books', {
      title: 'Browse Books - Bookify',
      user: req.user,
      books: books,
      genres: genres || [],
      currentPage: page,
      totalPages: totalPages,
      totalBooks: totalBooks,
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.render('books', {
      title: 'Browse Books - Bookify',
      user: req.user,
      books: [],
      genres: [],
      error: 'Failed to load books',
    });
  }
});

// Book Detail
router.get('/book/:id', async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate('author', 'name bio userId')
      .lean();

    if (!book) {
      return res.status(404).render('error', {
        status: 404,
        message: 'Book not found',
        user: req.user,
      });
    }

    // Set default values for missing fields
    book.coverImage = book.coverImage || {
      url: 'https://via.placeholder.com/300x400?text=No+Cover',
    };
    book.description = book.description || 'No description available';
    book.reviews = book.reviews || [];
    book.metadata = book.metadata || {};
    book.stats = book.stats || {
      averageRating: 0,
      reviewCount: 0,
      totalSales: 0,
    };
    book.pricing = book.pricing || {
      digital: { price: 0, isAvailable: false },
      physical: { price: 0, isAvailable: false },
    };

    res.render('bookDetail', {
      title: `${book.title} - Bookify`,
      user: req.user,
      book: book,
    });
  } catch (error) {
    console.error('Error fetching book:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error loading book details',
      user: req.user,
    });
  }
});

// Shopping Cart
router.get('/cart', async (req, res) => {
  try {
    const Cart = require('../models/cartModel');

    if (!req.user) {
      return res.render('cart', {
        title: 'Shopping Cart - Bookify',
        user: req.user,
        cartItems: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        hasPhysicalBooks: false,
        taxRate: 0,
      });
    }

    // Fetch user's cart with populated book details
    const cart = await Cart.findOne({ user: req.user._id })
      .populate({
        path: 'cartItems.book',
        select: 'title author coverImage pricing',
        populate: { path: 'author', select: 'name' },
      })
      .populate('coupon');

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return res.render('cart', {
        title: 'Shopping Cart - Bookify',
        user: req.user,
        cartItems: [],
        subtotal: 0,
        tax: 0,
        shippingCost: 0,
        discount: 0,
        total: 0,
        hasPhysicalBooks: false,
        taxRate: 0,
      });
    }

    // Process cart items with proper fallbacks
    const cartItems = cart.cartItems.map(item => ({
      _id: item._id,
      book: {
        _id: item.book._id,
        title: item.book.title || 'Unknown Title',
        author: item.book.author || { name: 'Unknown Author' },
        coverImage: item.book.coverImage || { url: '/placeholder-book.png' },
        pricing: item.book.pricing || {
          digital: { price: 0 },
          physical: { price: 0 },
        },
      },
      format: item.format || 'digital',
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    // Calculate totals
    const hasPhysicalBooks = cartItems.some(item => item.format === 'physical');
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const taxRate = 5; // 5% tax
    const tax = subtotal * (taxRate / 100);
    const shippingCost = hasPhysicalBooks ? 10 : 0;
    const discount = cart.totalCartPriceAfterDiscount
      ? subtotal - cart.totalCartPriceAfterDiscount
      : 0;
    const total = subtotal + tax + shippingCost - discount;

    res.render('cart', {
      title: 'Shopping Cart - Bookify',
      user: req.user,
      cartItems: cartItems,
      subtotal: subtotal,
      tax: tax,
      shippingCost: shippingCost,
      discount: discount,
      total: total,
      hasPhysicalBooks: hasPhysicalBooks,
      taxRate: taxRate,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.render('cart', {
      title: 'Shopping Cart - Bookify',
      user: req.user,
      cartItems: [],
      subtotal: 0,
      tax: 0,
      shippingCost: 0,
      discount: 0,
      total: 0,
      hasPhysicalBooks: false,
      taxRate: 0,
    });
  }
});

/////////////////////////////////////////////////////////////////
// PROTECTED ROUTES (User only)
/////////////////////////////////////////////////////////////////

// Checkout
router.get('/checkout', protect, async (req, res) => {
  try {
    const Cart = require('../models/cartModel');
    const User = require('../models/userModel');

    // Fetch user's cart with populated book details
    const cart = await Cart.findOne({ user: req.user._id }).populate({
      path: 'cartItems.book',
      select: 'title author coverImage pricing',
      populate: { path: 'author', select: 'name' },
    });

    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      return res.redirect('/cart');
    }

    // Get user's shipping addresses
    const userWithAddresses = await User.findById(req.user._id).select(
      'profile.addresses'
    );

    const addresses =
      userWithAddresses?.profile?.addresses?.filter(
        addr => addr.type === 'shipping'
      ) || [];

    // Process cart items
    const cartItems = cart.cartItems.map(item => ({
      _id: item._id,
      book: {
        _id: item.book._id,
        title: item.book.title || 'Unknown Title',
        author: item.book.author || { name: 'Unknown Author' },
        coverImage: item.book.coverImage || { url: '/placeholder-book.png' },
      },
      format: item.format || 'digital',
      quantity: item.quantity || 1,
      price: item.price || 0,
    }));

    // Calculate totals
    const hasPhysicalBooks = cartItems.some(item => item.format === 'physical');
    const subtotal = cartItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const tax = subtotal * 0.1; // 10% tax
    const shippingCost = hasPhysicalBooks ? 5.99 : 0;
    const discount = cart.totalCartPriceAfterDiscount
      ? subtotal - cart.totalCartPriceAfterDiscount
      : 0;
    const total = subtotal + tax + shippingCost - discount;

    res.render('checkout', {
      title: 'Checkout - Bookify',
      user: req.user,
      cartItems: cartItems,
      addresses: addresses,
      subtotal: subtotal,
      tax: tax,
      shippingCost: shippingCost,
      discount: discount,
      total: total,
    });
  } catch (error) {
    console.error('Error loading checkout:', error);
    res.redirect('/cart');
  }
});

// User Dashboard
router.get('/dashboard', protect, async (req, res) => {
  try {
    const Wishlist = require('../models/wishlistModel');
    const Cart = require('../models/cartModel');

    // Get user stats
    const wishlistCount = await Wishlist.countDocuments({ user: req.user._id });
    const cart = await Cart.findOne({ user: req.user._id });
    const cartCount = cart ? cart.cartItems.length : 0;

    const stats = {
      booksOwned: wishlistCount,
      totalSpent: req.user.totalSpent || 0,
      wishlistCount: wishlistCount,
      cartCount: cartCount,
      reviewCount: req.user.reviews ? req.user.reviews.length : 0,
    };

    res.render('dashboard', {
      title: 'Dashboard - Bookify',
      user: req.user,
      stats: stats,
      recentOrders: [],
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.render('dashboard', {
      title: 'Dashboard - Bookify',
      user: req.user,
      stats: {
        booksOwned: 0,
        totalSpent: 0,
        wishlistCount: 0,
        cartCount: 0,
        reviewCount: 0,
      },
      recentOrders: [],
    });
  }
});

// My Library
router.get('/library', protect, (req, res) => {
  res.render('library', {
    title: 'My Library - Bookify',
    user: req.user,
    books: [],
  });
});

// Wishlist
router.get('/wishlist', protect, async (req, res) => {
  try {
    const Wishlist = require('../models/wishlistModel');

    // Fetch user's wishlist with populated book details
    const wishlistItems = await Wishlist.find({ user: req.user._id })
      .populate({
        path: 'book',
        select: 'title author coverImage stats pricing metadata',
        populate: { path: 'author', select: 'name' },
      })
      .sort({ createdAt: -1 });

    // Extract book data with proper fallbacks
    const wishlistBooks = wishlistItems.map(item => ({
      _id: item.book._id,
      title: item.book.title || 'Unknown Title',
      author: item.book.author || { name: 'Unknown Author' },
      coverImage: item.book.coverImage || { url: '/placeholder-book.png' },
      stats: item.book.stats || { averageRating: 0, reviewCount: 0 },
      pricing: item.book.pricing || { digital: { price: 0 } },
      metadata: item.book.metadata || { genre: [] },
    }));

    res.render('wishlist', {
      title: 'Wishlist - Bookify',
      user: req.user,
      wishlistBooks: wishlistBooks || [],
    });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.render('wishlist', {
      title: 'Wishlist - Bookify',
      user: req.user,
      wishlistBooks: [],
    });
  }
});

// User Profile
router.get('/profile', protect, async (req, res) => {
  try {
    const Wishlist = require('../models/wishlistModel');
    const Cart = require('../models/cartModel');

    // Get user stats
    const wishlistCount = await Wishlist.countDocuments({ user: req.user._id });
    const cart = await Cart.findOne({ user: req.user._id });
    const cartCount = cart ? cart.cartItems.length : 0;
    const reviewCount = req.user.reviews ? req.user.reviews.length : 0;

    res.render('profile', {
      title: 'My Profile - Bookify',
      user: req.user,
      wishlistCount: wishlistCount,
      cartCount: cartCount,
      reviewCount: reviewCount,
      booksOwned: wishlistCount,
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.render('profile', {
      title: 'My Profile - Bookify',
      user: req.user,
      wishlistCount: 0,
      cartCount: 0,
      reviewCount: 0,
      booksOwned: 0,
    });
  }
});

// Profile Edit
router.get('/profile/edit', protect, (req, res) => {
  res.render('profile-edit', {
    title: 'Edit Profile - Bookify',
    user: req.user,
  });
});

// Settings
router.get('/settings', protect, (req, res) => {
  res.render('settings', {
    title: 'Settings - Bookify',
    user: req.user,
  });
});

// Addresses
router.get('/addresses', protect, async (req, res) => {
  try {
    const User = require('../models/userModel');
    const userWithAddresses = await User.findById(req.user._id).select(
      'profile.addresses'
    );
    const addresses = userWithAddresses?.profile?.addresses || [];

    res.render('addresses', {
      title: 'My Addresses - Bookify',
      user: req.user,
      addresses: addresses,
    });
  } catch (error) {
    console.error('Error loading addresses:', error);
    res.render('addresses', {
      title: 'My Addresses - Bookify',
      user: req.user,
      addresses: [],
    });
  }
});

// Orders
router.get('/orders', protect, async (req, res) => {
  try {
    const Order = require('../models/orderModel');
    const Book = require('../models/bookModel');

    // Fetch user's orders with item details
    const orders = await Order.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    // Populate book details for each order item
    for (let order of orders) {
      for (let item of order.items) {
        const book = await Book.findById(item.bookId)
          .select('title coverImage')
          .lean();
        item.book = book || {
          title: item.title,
          coverImage: { url: '/placeholder-book.png' },
        };
      }
    }

    res.render('orders', {
      title: 'Order History - Bookify',
      user: req.user,
      orders: orders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.render('orders', {
      title: 'Order History - Bookify',
      user: req.user,
      orders: [],
      error: 'Failed to load orders',
    });
  }
});

/////////////////////////////////////////////////////////////////
// ADMIN ROUTES (Admin only)
/////////////////////////////////////////////////////////////////

router.get('/admin/dashboard', protect, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied' });
  }
  res.render('adminDashboard', {
    title: 'Admin Dashboard - Bookify',
    user: req.user,
    stats: {},
    pendingBooks: [],
    recentOrders: [],
    recentUsers: [],
  });
});

/////////////////////////////////////////////////////////////////
// AUTHOR ROUTES (Author/Admin)
/////////////////////////////////////////////////////////////////

router.get('/author/dashboard', protect, (req, res) => {
  if (req.user.role !== 'author' && req.user.role !== 'admin') {
    return res.status(403).render('error', { message: 'Access denied' });
  }
  res.render('authorDashboard', {
    title: 'Author Dashboard - Bookify',
    user: req.user,
    stats: {},
    myBooks: [],
    recentReviews: [],
  });
});

module.exports = router;
