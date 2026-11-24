const BaseRepository = require('./base.repository');

const COUPONS_DATA = {
  'BRIGHT10': { code: 'BRIGHT10', discountPercent: 10, description: '10% Off Welcome Voucher', active: true },
  'BRIGHTBUY20': { code: 'BRIGHTBUY20', discountPercent: 20, description: 'Special 20% Holiday Discount', active: true },
  'FREESHIP': { code: 'FREESHIP', freeShipping: true, description: 'Free Islandwide Delivery', active: true }
};

class MarketingRepository extends BaseRepository {
  constructor() {
    super('subscribers.json');
  }

  getCoupon(code) {
    if (!code) return null;
    const clean = code.trim().toUpperCase();
    return COUPONS_DATA[clean] || null;
  }

  getSubscribers() {
    return this.read();
  }

  addSubscriber(email) {
    const subscribers = this.read();
    const clean = email.trim().toLowerCase();
    const exists = subscribers.some(s => s.email.toLowerCase() === clean);

    if (exists) {
      return { alreadySubscribed: true };
    }

    const newSub = {
      email: clean,
      subscribedAt: new Date().toISOString()
    };
    subscribers.push(newSub);
    this.write(subscribers);
    return { alreadySubscribed: false, subscriber: newSub };
  }
}

module.exports = new MarketingRepository();
