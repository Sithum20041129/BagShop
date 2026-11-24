const express = require('express');
const cors = require('cors');
const path = require('path');
const securityConfig = require('./config/security.config');
const { helmetMiddleware, apiRateLimiter, sanitizeInputs } = require('./middlewares/security.middleware');
const { authenticateUser } = require('./middlewares/auth.middleware');
const { notFoundHandler, errorHandler } = require('./middlewares/error.middleware');
const apiRoutes = require('./routes');

const app = express();

// 1. Security Layer (Helmet & CORS)
app.use(helmetMiddleware);
app.use(cors(securityConfig.cors));

// 2. Request Parsing Layer
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(sanitizeInputs);

// 3. Authentication Layer (Extracts and verifies JWT/Clerk token)
app.use(authenticateUser);

// 4. Rate Limiting Layer (Protected against brute-force & DDoS)
app.use('/api', apiRateLimiter);

// 5. Routing Layer
app.use('/api/v1', apiRoutes);
app.use('/api', apiRoutes); // Backwards compatibility alias

// 6. Static Asset Serving
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback to index.html for SPA-style client routing (if non-API)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// 7. Error Handling Layer
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
