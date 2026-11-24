const orderRepository = require('../repositories/order.repository');
const productRepository = require('../repositories/product.repository');
const marketingRepository = require('../repositories/marketing.repository');

class OrderService {
  createOrder(orderData, user = null) {
    const { customer, items, paymentMethod, couponCode, deliveryNotes } = orderData;

    if (!customer || !customer.name || !customer.phone || !customer.address || !customer.city) {
      const error = new Error('Please provide all required delivery details (Name, Phone, Address, City).');
      error.statusCode = 400;
      throw error;
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      const error = new Error('Cart cannot be empty.');
      error.statusCode = 400;
      throw error;
    }

    const allProducts = productRepository.findAll();
    let subtotal = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = allProducts.find(p => p.id === item.id);
      if (!product) {
        const error = new Error(`Product ${item.id} is invalid or discontinued.`);
        error.statusCode = 400;
        throw error;
      }

      const qty = Math.max(1, Number(item.quantity) || 1);
      subtotal += product.price * qty;

      verifiedItems.push({
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: qty,
        selectedColor: item.selectedColor || (product.colors && product.colors[0]?.name) || 'Standard',
        image: product.images[0]
      });
    }

    // Shipping fee rule: Free islandwide delivery over Rs. 15,000, otherwise Rs. 650
    let shippingFee = subtotal >= 15000 ? 0 : 650;
    let discount = 0;

    if (couponCode) {
      const coupon = marketingRepository.getCoupon(couponCode);
      if (coupon) {
        if (coupon.freeShipping) {
          shippingFee = 0;
        }
        if (coupon.discountPercent) {
          discount = Math.round((subtotal * coupon.discountPercent) / 100);
        }
      }
    }

    const total = Math.max(0, subtotal - discount + shippingFee);

    // Generate Order ID: BB-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `BB-2026-${randomSuffix}`;
    const now = new Date();

    const newOrder = {
      orderId,
      userId: user ? user.id : (customer.userId || null),
      createdAt: now.toISOString(),
      customer: {
        name: customer.name.trim(),
        email: customer.email ? customer.email.trim() : (user ? user.email : ''),
        phone: customer.phone.trim(),
        address: customer.address.trim(),
        city: customer.city.trim(),
        district: customer.district || 'Colombo',
        postalCode: customer.postalCode || ''
      },
      items: verifiedItems,
      subtotal,
      discount,
      shippingFee,
      total,
      couponApplied: couponCode ? couponCode.toUpperCase() : null,
      paymentMethod: paymentMethod || 'Cash on Delivery (COD)',
      paymentStatus: paymentMethod === 'Card Payment' ? 'Paid Online' : 'Pending on Delivery',
      orderStatus: 'Order Placed',
      deliveryNotes: deliveryNotes || '',
      trackingSteps: [
        { status: 'Order Placed', time: now.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }), completed: true },
        { status: 'Payment Confirmed', time: paymentMethod === 'Card Payment' ? 'Instant' : 'To collect on delivery', completed: paymentMethod === 'Card Payment' },
        { status: 'Packed at Central Warehouse', time: 'Estimated within 24 hours', completed: false },
        { status: 'Handed to Courier Partner', time: 'Pending', completed: false },
        { status: 'Out for Delivery', time: 'Pending (2-3 business days)', completed: false },
        { status: 'Delivered', time: 'Pending', completed: false }
      ]
    };

    return orderRepository.create(newOrder);
  }

  getOrderById(orderId) {
    const order = orderRepository.findById(orderId);
    if (!order) {
      const error = new Error(`No order found with reference "${orderId}". Please verify your order ID.`);
      error.statusCode = 404;
      throw error;
    }
    return order;
  }

  getUserOrders(userId) {
    if (!userId) return [];
    return orderRepository.findByUserId(userId);
  }

  getAllOrders() {
    return orderRepository.findAll();
  }

  updateOrderStatus(orderId, status, note = '') {
    const validStatuses = [
      'Order Placed',
      'Confirmed',
      'Packed',
      'Dispatched with Courier',
      'Delivered',
      'Discarded',
      'Cancelled'
    ];

    if (!validStatuses.includes(status)) {
      const error = new Error(`Invalid status "${status}". Allowed values: ${validStatuses.join(', ')}`);
      error.statusCode = 400;
      throw error;
    }

    const updated = orderRepository.updateStatus(orderId, status, note);
    if (!updated) {
      const error = new Error(`Order with ID "${orderId}" not found.`);
      error.statusCode = 404;
      throw error;
    }
    return updated;
  }

  deleteOrder(orderId) {
    const deleted = orderRepository.delete(orderId);
    if (!deleted) {
      const error = new Error(`Order with ID "${orderId}" not found.`);
      error.statusCode = 404;
      throw error;
    }
    return true;
  }
}

module.exports = new OrderService();
