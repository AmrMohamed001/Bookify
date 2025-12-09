module.exports = (err, req, res, next) => {
  err.statusCode ||= 500;
  err.status ||= 'Error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
    error: err,
    stack: err.stack,
  });
};
//TODO : complete this middleware
