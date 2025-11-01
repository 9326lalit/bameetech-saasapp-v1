const express = require('express');
const { createDirectSubscription, getUserSubscription, getAllUserSubscriptions } = require('../controllers/subscription.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// User subscription routes
router.post('/subscribe-direct', verifyToken, createDirectSubscription);
router.get('/my-subscription', verifyToken, getUserSubscription);
router.get('/my-subscriptions', verifyToken, getAllUserSubscriptions);

module.exports = router;