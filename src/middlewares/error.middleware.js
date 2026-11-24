const envConfig = require('../config/env.config');

const notFoundHandler = (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.originalUrl} does not exist.`
    });
  }
  next();
};

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  if (!envConfig.isProduction) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    ...(envConfig.isProduction ? {} : { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};
