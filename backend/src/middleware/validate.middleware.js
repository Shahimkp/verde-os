const { errorResponse } = require('../utils/response');

const validate = (schema) => (req, res, next) => {
  try {
    // Validate request body, query, and params against the schema
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    // Standardize Zod errors
    let details = [];
    if (error.errors && typeof error.errors.map === 'function') {
      details = error.errors.map(err => ({
        path: err.path ? err.path.join('.') : 'unknown',
        message: err.message
      }));
    } else if (error.issues) {
      details = error.issues.map(err => ({
        path: err.path ? err.path.join('.') : 'unknown',
        message: err.message
      }));
    } else {
      details = [{ message: error.message }];
    }

    return errorResponse(res, {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request data',
      details
    }, 400);
  }
};

module.exports = validate;
