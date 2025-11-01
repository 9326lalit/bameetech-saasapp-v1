const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, handleWebhook , getUserSubscription , getAllUserSubscriptions, cancelSubscription } = require('../controllers/subscription.controller.js');
const { verifyToken } = require('../middlewares/auth.middleware');

router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);
router.post('/webhook', express.json({ type: 'application/json' }), handleWebhook);

router.get('/my-subscription', verifyToken, getUserSubscription);
router.get('/my-subscriptions', verifyToken, getAllUserSubscriptions);
router.post('/cancel', cancelSubscription);


module.exports = router;
