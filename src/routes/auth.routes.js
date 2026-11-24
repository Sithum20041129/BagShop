const express = require('express');
const authController = require('../controllers/auth.controller');
const { authRateLimiter } = require('../middlewares/security.middleware');
const { validateLogin, validateRegister } = require('../middlewares/validation.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', authRateLimiter, validateRegister, (req, res, next) => authController.register(req, res, next));
router.post('/login', authRateLimiter, validateLogin, (req, res, next) => authController.login(req, res, next));
router.get('/me', requireAuth, (req, res, next) => authController.getMe(req, res, next));
router.post('/clerk-sync', (req, res, next) => authController.syncClerk(req, res, next));
router.get('/config', (req, res, next) => authController.getConfig(req, res, next));

module.exports = router;
