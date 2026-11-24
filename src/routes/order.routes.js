const express = require('express');
const orderController = require('../controllers/order.controller');
const { validateOrder } = require('../middlewares/validation.middleware');
const { requireAuth } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/', validateOrder, (req, res, next) => orderController.createOrder(req, res, next));
router.get('/my-orders', requireAuth, (req, res, next) => orderController.getMyOrders(req, res, next));
router.get('/:orderId', (req, res, next) => orderController.getOrderById(req, res, next));

module.exports = router;
