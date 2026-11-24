const express = require('express');
const productController = require('../controllers/product.controller');

const router = express.Router();

router.get('/', (req, res, next) => productController.getCategories(req, res, next));

module.exports = router;
