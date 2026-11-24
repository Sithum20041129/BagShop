const express = require('express');
const adminController = require('../controllers/admin.controller');
const { requireAuth, requireAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Dashboard overview stats
router.get('/stats', (req, res, next) => adminController.getStats(req, res, next));

// Order management (View, Confirm, Discard, Update)
router.get('/orders', (req, res, next) => adminController.getAllOrders(req, res, next));
router.patch('/orders/:orderId/status', (req, res, next) => adminController.updateOrderStatus(req, res, next));
router.delete('/orders/:orderId', (req, res, next) => adminController.deleteOrder(req, res, next));

// Product management (Add, Delete)
router.post('/products', (req, res, next) => adminController.addProduct(req, res, next));
router.delete('/products/:id', (req, res, next) => adminController.deleteProduct(req, res, next));

module.exports = router;
