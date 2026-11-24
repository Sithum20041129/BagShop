const app = require('./src/app');
const envConfig = require('./src/config/env.config');

const server = app.listen(envConfig.port, () => {
  console.log(`\n========================================================`);
  console.log(` 👜 Bright Buy - Production-Grade E-Commerce Platform`);
  console.log(` 🚀 Environment : ${envConfig.nodeEnv}`);
  console.log(` 🌐 Server URL  : http://localhost:${envConfig.port}`);
  console.log(` 🛡️  Security    : Helmet, CORS Whitelist & Rate Limiting Enabled`);
  console.log(` 🔐 Auth Layer  : JWT Enabled (Clerk Ready: ${envConfig.clerk.isConfigured ? 'Connected' : 'Configured for SDK sync'})`);
  console.log(` 📡 API Routes  : ${envConfig.apiPrefix} & /api`);
  console.log(`========================================================\n`);
});

// Graceful shutdown handling
const handleShutdown = (signal) => {
  console.log(`\n[Server] Received ${signal}. Closing HTTP server gracefully...`);
  server.close(() => {
    console.log('[Server] HTTP server closed. Process terminating cleanly.');
    process.exit(0);
  });

  // Force shutdown if taking longer than 10s
  setTimeout(() => {
    console.error('[Server] Forceful shutdown initiated due to timeout.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

module.exports = server;
