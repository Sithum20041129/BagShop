const productService = require('../services/product.service');

class ProductController {
  getProducts(req, res, next) {
    try {
      const products = productService.getAllProducts(req.query);
      res.json({
        success: true,
        count: products.length,
        products
      });
    } catch (err) {
      next(err);
    }
  }

  getProductById(req, res, next) {
    try {
      const result = productService.getProductById(req.params.id);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Product not found.' });
      }
      res.json({
        success: true,
        product: result.product,
        related: result.related
      });
    } catch (err) {
      next(err);
    }
  }

  getCategories(req, res, next) {
    try {
      const categories = productService.getCategories();
      res.json({
        success: true,
        count: categories.length,
        categories
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ProductController();
