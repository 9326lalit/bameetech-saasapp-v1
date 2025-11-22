const express = require('express');
const {
  generateContentAccessToken,
  viewProtectedContent,
  getAccessHistory
} = require('../controllers/contentProxy.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

const router = express.Router();

// Generate access token (requires authentication)
router.post('/generate-token', verifyToken, generateContentAccessToken);

// View protected content (public with token)
router.get('/view/:token', viewProtectedContent);

// Get access history (requires authentication)
router.get('/history', verifyToken, getAccessHistory);

module.exports = router;
