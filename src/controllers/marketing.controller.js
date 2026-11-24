const marketingService = require('../services/marketing.service');

class MarketingController {
  validateCoupon(req, res, next) {
    try {
      const { code } = req.body;
      const coupon = marketingService.validateCoupon(code);
      res.json({
        success: true,
        code: coupon.code,
        coupon
      });
    } catch (err) {
      next(err);
    }
  }

  subscribeNewsletter(req, res, next) {
    try {
      const { email } = req.body;
      const result = marketingService.subscribeNewsletter(email);
      res.json({
        success: true,
        ...result
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MarketingController();
