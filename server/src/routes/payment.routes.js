const express = require('express');
const { createOrder, verifyPayment, handleWebhook } = require('../controllers/payment.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/create-order', verifyToken, createOrder);
router.post('/verify', verifyToken, verifyPayment);
router.post('/webhook', handleWebhook);

module.exports = router;