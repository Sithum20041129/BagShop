const BaseRepository = require('./base.repository');

class OrderRepository extends BaseRepository {
  constructor() {
    super('orders.json');
  }

  findAll() {
    return this.read();
  }

  findById(orderId) {
    const orders = this.read();
    const cleanId = (orderId || '').trim().toUpperCase();
    return orders.find(o => o.orderId.toUpperCase() === cleanId) || null;
  }

  findByUserId(userId) {
    const orders = this.read();
    return orders.filter(o => o.userId === userId || (o.customer && o.customer.userId === userId));
  }

  create(order) {
    const orders = this.read();
    orders.unshift(order);
    this.write(orders);
    return order;
  }

  updateStatus(orderId, newStatus, note = '') {
    const orders = this.read();
    const cleanId = (orderId || '').trim().toUpperCase();
    const index = orders.findIndex(o => o.orderId.toUpperCase() === cleanId);
    if (index === -1) return null;

    const order = orders[index];
    order.orderStatus = newStatus;
    order.updatedAt = new Date().toISOString();

    const timestamp = new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });

    if (!order.trackingSteps) {
      order.trackingSteps = [];
    }

    if (newStatus === 'Confirmed') {
      order.paymentStatus = 'Confirmed';
      order.trackingSteps.forEach(step => {
        if (step.status === 'Payment Confirmed' || step.status === 'Packed at Central Warehouse') {
          step.completed = true;
          step.time = timestamp;
        }
      });
    } else if (newStatus === 'Discarded' || newStatus === 'Cancelled') {
      order.paymentStatus = 'Cancelled';
      order.trackingSteps.push({
        status: `Order Discarded: ${note || 'Cancelled by Store Administrator'}`,
        time: timestamp,
        completed: true,
        isCancellation: true
      });
    } else if (newStatus === 'Dispatched with Courier') {
      order.trackingSteps.forEach(step => {
        if (step.status.includes('Courier') || step.status.includes('Warehouse')) {
          step.completed = true;
          step.time = timestamp;
        }
      });
    } else if (newStatus === 'Delivered') {
      order.paymentStatus = 'Paid';
      order.trackingSteps.forEach(step => {
        step.completed = true;
        if (step.time === 'Pending') step.time = timestamp;
      });
    }

    orders[index] = order;
    this.write(orders);
    return order;
  }

  delete(orderId) {
    const orders = this.read();
    const cleanId = (orderId || '').trim().toUpperCase();
    const filtered = orders.filter(o => o.orderId.toUpperCase() !== cleanId);
    if (filtered.length !== orders.length) {
      this.write(filtered);
      return true;
    }
    return false;
  }
}

module.exports = new OrderRepository();
