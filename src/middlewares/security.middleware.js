const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const securityConfig = require('../config/security.config');

const helmetMiddleware = helmet(securityConfig.helmet);
const apiRateLimiter = rateLimit(securityConfig.rateLimit);
const authRateLimiter = rateLimit(securityConfig.authRateLimit);

// Sanitization middleware: trims whitespace on string request body fields
const sanitizeInputs = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  next();
};

module.exports = {
  helmetMiddleware,
  apiRateLimiter,
  authRateLimiter,
  sanitizeInputs
};
