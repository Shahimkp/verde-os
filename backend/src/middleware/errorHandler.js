const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  
  // In production, do not expose internal error details or stack traces
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: {
      message: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    }
  });
};

module.exports = errorHandler;
