const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/', (req, res, next) => productController.getProducts(req, res, next));
router.get('/:id', (req, res, next) => productController.getProductById(req, res, next));

module.exports = router;
