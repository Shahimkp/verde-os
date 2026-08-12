const successResponse = (res, data, meta = null, statusCode = 200) => {
  const response = {
    success: true,
    data,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return res.status(statusCode).json(response);
};

const errorResponse = (res, error, statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_ERROR',
      message: error.message || 'An unexpected error occurred.',
      details: error.details || undefined
    }
  });
};

module.exports = {
  successResponse,
  errorResponse
};
