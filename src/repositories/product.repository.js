const BaseRepository = require('./base.repository');

class ProductRepository extends BaseRepository {
  constructor() {
    super('products.json');
  }

  findAll() {
    return this.read();
  }

  findById(id) {
    const products = this.read();
    return products.find(p => p.id === id) || null;
  }

  findByCategory(category) {
    const products = this.read();
    return products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  create(product) {
    const products = this.read();
    products.unshift(product);
    this.write(products);
    return product;
  }

  delete(id) {
    const products = this.read();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length !== products.length) {
      this.write(filtered);
      return true;
    }
    return false;
  }
}

module.exports = new ProductRepository();
