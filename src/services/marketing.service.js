const marketingRepository = require('../repositories/marketing.repository');

class MarketingService {
  validateCoupon(code) {
    if (!code) {
      const error = new Error('Please enter a coupon code.');
      error.statusCode = 400;
      throw error;
    }

    const coupon = marketingRepository.getCoupon(code);
    if (!coupon || !coupon.active) {
      const error = new Error('Invalid or expired coupon code. Try BRIGHT10 for 10% off!');
      error.statusCode = 404;
      throw error;
    }

    return coupon;
  }

  subscribeNewsletter(email) {
    if (!email || !email.includes('@')) {
      const error = new Error('Please enter a valid email address.');
      error.statusCode = 400;
      throw error;
    }

    const result = marketingRepository.addSubscriber(email);

    if (result.alreadySubscribed) {
      return {
        alreadySubscribed: true,
        message: 'You are already a Bright Buy VIP member! Use code BRIGHT10 for 10% off.',
        code: 'BRIGHT10'
      };
    }

    return {
      alreadySubscribed: false,
      message: 'Welcome to Bright Buy VIP! Use promo code BRIGHT10 for 10% off your entire order.',
      code: 'BRIGHT10'
    };
  }
}

module.exports = new MarketingService();
