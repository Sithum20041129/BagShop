const authService = require('../services/auth.service');
const envConfig = require('../config/env.config');

class AuthController {
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;
      const result = await authService.register({ name, email, password, phone });
      res.status(201).json({
        success: true,
        message: 'Account created successfully! Welcome to Bright Buy.',
        user: result.user,
        token: result.token
      });
    } catch (err) {
      next(err);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const result = await authService.login({ email, password });
      res.json({
        success: true,
        message: 'Signed in successfully!',
        user: result.user,
        token: result.token
      });
    } catch (err) {
      next(err);
    }
  }

  getMe(req, res) {
    res.json({
      success: true,
      user: req.user
    });
  }

  // Clerk third-party auth sync endpoint
  async syncClerk(req, res, next) {
    try {
      const { clerkId, email, name, avatar } = req.body;
      const result = await authService.syncClerkUser({ clerkId, email, name, avatar });
      res.json({
        success: true,
        message: 'Clerk authentication synced successfully.',
        user: result.user,
        token: result.token
      });
    } catch (err) {
      next(err);
    }
  }

  // Auth configuration info for client (e.g. publishable key for Clerk)
  getConfig(req, res) {
    res.json({
      success: true,
      clerkEnabled: envConfig.clerk.isConfigured,
      clerkPublishableKey: envConfig.clerk.publishableKey || null
    });
  }
}

module.exports = new AuthController();
