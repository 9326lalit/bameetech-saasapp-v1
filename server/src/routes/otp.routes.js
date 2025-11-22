const express = require('express');
const { sendOTP, verifyOTP, resendOTP } = require('../controllers/otp.controller');

const router = express.Router();

// Public routes (no authentication required)
router.post('/send', sendOTP);
router.post('/verify', verifyOTP);
router.post('/resend', resendOTP);

module.exports = router;
