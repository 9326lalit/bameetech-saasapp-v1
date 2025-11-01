const express = require('express');
const router = express.Router();
const { getAllPayments, getAllOrders, getAllSubscriptions } = require('../controllers/razorpay.controller');

// routes
router.get('/payments', getAllPayments);
router.get('/orders', getAllOrders);
router.get('/subscriptions', getAllSubscriptions);

module.exports = router;
