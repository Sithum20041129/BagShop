const authService = require('../services/auth.service');
const userRepository = require('../repositories/user.repository');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      req.user = null;
      return next();
    }

    // Check JWT local / standard verification
    const decoded = authService.verifyToken(token);
    if (decoded && decoded.id) {
      const user = userRepository.findById(decoded.id);
      if (user) {
        req.user = authService.sanitizeUser(user);
        return next();
      }
    }

    // Clerk third-party token fallback / clerk header
    const clerkId = req.headers['x-clerk-user-id'];
    if (clerkId) {
      const clerkUser = userRepository.findByClerkId(clerkId);
      if (clerkUser) {
        req.user = authService.sanitizeUser(clerkUser);
        return next();
      }
    }

    req.user = null;
    next();
  } catch (err) {
    req.user = null;
    next();
  }
};

const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Please sign in to access this resource.'
    });
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Administrator privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticateUser,
  requireAuth,
  requireAdmin
};
