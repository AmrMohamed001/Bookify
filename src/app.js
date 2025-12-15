const express = require('express');
const morgan = require('morgan');
const app = express();
const AppError = require('./utils/appError');
const globalErrorHandlingMiddleware = require('./middlewares/globalErrorHandlingMiddleware');
const passport = require('./config/passport');
/////////////////////////////////////////////////////////////////
const categoryRouter = require('./routes/categoryRoute');
const authRouter = require('./routes/authRoute');
const userRouter = require('./routes/userRoute');
const bookRouter = require('./routes/bookRoute');
const reviewRouter = require('./routes/reviewRoute');
/////////////////////////////////////////////////////////////////
// MIDDLEWARES
app.use(express.json({ limit: '10kb' }));
app.use(express.static(`${__dirname}/public`));
app.use(passport.initialize());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});
app.get('/', (req, res) =>
  res
    .status(200)
    .json({ message: 'Welcome to Bookify server', timeCost: req.requestTime })
);
/////////////////////////////////////////////////////////////////
// MOUNTING
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/books', bookRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('/*splat', (req, res, next) => {
  return next(
    new AppError(400, `Can't find this route: ${req.originalUrl}`, 400)
  );
});
app.use(globalErrorHandlingMiddleware);
module.exports = app;

/*
1- Wishlist
2- Cart , Order and Checkout
3- push notifications
4- personalized recommendations
5- Author and admin dashboards
6- invoice generation
7- user library with reading progress tracking
8- summery section using ai (groq)
*/
