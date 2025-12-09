const express = require('express');
const morgan = require('morgan');
const app = express();
const AppError = require('./utils/AppError');
const globalErrorHandlingMiddleware = require('./middlewares/globalErrorHandlingMiddleware');
/////////////////////////////////////////////////////////////////
const categoryRouter = require('./routes/categoryRoute');
const authRouter = require('./routes/authRoute');
/////////////////////////////////////////////////////////////////
// MIDDLEWARES
app.use(express.json({ limit: '10kb' }));
app.use(express.static(`${__dirname}/public`));
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

app.all('/*splat', (req, res, next) => {
  return next(
    new AppError(400, `Can't find this route: ${req.originalUrl}`, 400)
  );
});
app.use(globalErrorHandlingMiddleware);
module.exports = app;
