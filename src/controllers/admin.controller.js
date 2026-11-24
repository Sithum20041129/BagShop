const orderService = require('../services/order.service');
const productService = require('../services/product.service');

class AdminController {
  getStats(req, res, next) {
    try {
      const orders = orderService.getAllOrders();
      const products = productService.getAllProducts();

      const totalRevenue = orders.reduce((sum, o) => {
        return (o.orderStatus !== 'Discarded' && o.orderStatus !== 'Cancelled') ? sum + (o.total || 0) : sum;
      }, 0);

      const pendingOrders = orders.filter(o => o.orderStatus === 'Order Placed').length;
      const confirmedOrders = orders.filter(o => o.orderStatus === 'Confirmed').length;
      const discardedOrders = orders.filter(o => o.orderStatus === 'Discarded' || o.orderStatus === 'Cancelled').length;

      res.json({
        success: true,
        stats: {
          totalRevenue,
          totalOrders: orders.length,
          pendingOrders,
          confirmedOrders,
          discardedOrders,
          totalProducts: products.length
        }
      });
    } catch (err) {
      next(err);
    }
  }

  getAllOrders(req, res, next) {
    try {
      const orders = orderService.getAllOrders();
      res.json({
        success: true,
        count: orders.length,
        orders
      });
    } catch (err) {
      next(err);
    }
  }

  updateOrderStatus(req, res, next) {
    try {
      const { orderId } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
      }

      const updatedOrder = orderService.updateOrderStatus(orderId, status, note);
      res.json({
        success: true,
        message: `Order ${orderId} has been updated to "${status}".`,
        order: updatedOrder
      });
    } catch (err) {
      next(err);
    }
  }

  deleteOrder(req, res, next) {
    try {
      const { orderId } = req.params;
      orderService.deleteOrder(orderId);
      res.json({
        success: true,
        message: `Order ${orderId} deleted successfully.`
      });
    } catch (err) {
      next(err);
    }
  }

  addProduct(req, res, next) {
    try {
      const product = productService.createProduct(req.body);
      res.status(201).json({
        success: true,
        message: `Product "${product.name}" added to catalog successfully!`,
        product
      });
    } catch (err) {
      next(err);
    }
  }

  deleteProduct(req, res, next) {
    try {
      const { id } = req.params;
      productService.deleteProduct(id);
      res.json({
        success: true,
        message: `Product ${id} removed successfully.`
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
