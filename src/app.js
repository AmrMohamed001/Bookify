const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandlingMiddleware = require('./middlewares/globalErrorHandlingMiddleware');
const passport = require('./config/passport');
/////////////////////////////////////////////////////////////////
// ROUTE IMPORTS
const viewRoutes = require('./routes/viewRoutes');
const categoryRouter = require('./routes/categoryRoute');
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const bookRouter = require('./routes/bookRoute');
const reviewRouter = require('./routes/reviewRoute');
const couponRouter = require('./routes/couponRoute');
const cartRouter = require('./routes/cartRoute');
const orderRouter = require('./routes/orderRoute');
const wishlistRouter = require('./routes/wishlistRoute');
/////////////////////////////////////////////////////////////////
// CONFIGURE PUG VIEW ENGINE
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
/////////////////////////////////////////////////////////////////
// MIDDLEWARES
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));
app.use(cookieParser());
app.use(express.static(`${__dirname}/public`));
app.use(passport.initialize());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Optional authentication middleware for views - sets req.user if logged in
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./models/userModel');

app.use(async (req, res, next) => {
  try {
    // Check for token in Authorization header or cookies
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (token) {
      try {
        const decoded = await promisify(jwt.verify)(
          token,
          process.env.JWT_SECRET
        );
        const currentUser = await User.findById(decoded.id);
        if (
          currentUser &&
          currentUser.isActive &&
          currentUser.isEmailVerified
        ) {
          req.user = currentUser;
        }
      } catch (err) {
        // Token invalid or expired, continue without user
      }
    }
  } catch (error) {
    console.error('Error in optional auth middleware:', error);
  }
  next();
});

/////////////////////////////////////////////////////////////////
// VIEW ROUTES MOUNTING
app.use('/', viewRoutes);

/////////////////////////////////////////////////////////////////
app.get('/api', (req, res) =>
  res
    .status(200)
    .json({ message: 'Welcome to Bookify API', timeCost: req.requestTime })
);
/////////////////////////////////////////////////////////////////
// MOUNTING
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/coupons', couponRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', orderRouter);
app.use('/api/v1/wishlist', wishlistRouter);

app.all('/*splat', (req, res, next) => {
  return next(
    new AppError(400, `Can't find this route: ${req.originalUrl}`, 400)
  );
});

// 404 Error Handler
app.use((req, res) => {
  res.status(404).render('error', {
    status: 404,
    message: 'Page not found',
    user: req.user,
  });
});

app.use(globalErrorHandlingMiddleware);
module.exports = app;

/*
2- Checkout
3- push notifications
4- personalized recommendations
5- Author and admin dashboards
6- invoice generation
7- user library with reading progress tracking
8- summery section using ai (groq)
*/
