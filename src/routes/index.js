const express = require('express');
const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const categoryRoutes = require('./category.routes');
const orderRoutes = require('./order.routes');
const couponRoutes = require('./coupon.routes');
const newsletterRoutes = require('./newsletter.routes');
const adminRoutes = require('./admin.routes');

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount modular sub-routers
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/categories', categoryRoutes);
router.use('/orders', orderRoutes);
router.use('/coupons', couponRoutes);
router.use('/coupon', couponRoutes); // compatibility alias
router.use('/newsletter', newsletterRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
