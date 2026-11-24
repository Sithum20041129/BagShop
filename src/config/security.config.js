const envConfig = require('./env.config');

const securityConfig = {
  helmet: {
    contentSecurityPolicy: envConfig.isProduction ? {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://*.clerk.accounts.dev", "https://clerk.brightbuy.lk"],
        scriptSrcAttr: ["'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.clerk.com", "https://img.clerk.com", "https://ui-avatars.com"],
        connectSrc: ["'self'", "https://*.clerk.accounts.dev", "https://api.clerk.com"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    } : false,
    crossOriginEmbedderPolicy: false
  },
  cors: {
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || envConfig.corsOrigin === '*') {
        return callback(null, true);
      }
      const allowedOrigins = envConfig.corsOrigin.split(',').map(o => o.trim());
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  },
  rateLimit: {
    windowMs: envConfig.rateLimit.windowMs,
    max: envConfig.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests from this IP address. Please try again after 15 minutes.'
    }
  },
  authRateLimit: {
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 15, // limit each IP to 15 login/register attempts per window
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again after 15 minutes.'
    }
  }
};

module.exports = securityConfig;
