require('dotenv').config();

const envConfig = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // 15 mins
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 300
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'brightbuy_fallback_secret_key_change_me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  },
  clerk: {
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY || '',
    secretKey: process.env.CLERK_SECRET_KEY || '',
    jwtKey: process.env.CLERK_JWT_KEY || '',
    isConfigured: Boolean(
      process.env.CLERK_SECRET_KEY &&
      !process.env.CLERK_SECRET_KEY.includes('sample_')
    )
  }
};

module.exports = envConfig;
