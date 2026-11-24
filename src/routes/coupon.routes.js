const express = require('express');
const marketingController = require('../controllers/marketing.controller');

const router = express.Router();

router.post('/validate', (req, res, next) => marketingController.validateCoupon(req, res, next));

module.exports = router;
