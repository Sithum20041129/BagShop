const express = require('express');
const marketingController = require('../controllers/marketing.controller');

const router = express.Router();

router.post('/', (req, res, next) => marketingController.subscribeNewsletter(req, res, next));

module.exports = router;
