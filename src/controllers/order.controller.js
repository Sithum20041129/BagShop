const orderService = require('../services/order.service');

class OrderController {
  createOrder(req, res, next) {
    try {
      const order = orderService.createOrder(req.body, req.user);
      res.status(201).json({
        success: true,
        message: 'Order placed successfully!',
        order
      });
    } catch (err) {
      next(err);
    }
  }

  getOrderById(req, res, next) {
    try {
      const order = orderService.getOrderById(req.params.orderId);
      res.json({
        success: true,
        order
      });
    } catch (err) {
      next(err);
    }
  }

  getMyOrders(req, res, next) {
    try {
      const orders = orderService.getUserOrders(req.user.id);
      res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new OrderController();
