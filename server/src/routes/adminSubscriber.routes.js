const express = require('express');
const router = express.Router();
const {
  testAdminGrant,
  createSubscriber,
  grantAccessToExistingUser,
  searchExistingUsers,
  getAdminGrantedSubscribers,
  updateSubscriberAccess,
  deleteSubscriber,
  getSubscriberDetails
} = require('../controllers/adminSubscriber.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

// All routes require super admin access
router.use(verifyToken, isSuperAdmin);

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ message: 'Admin subscriber routes working', user: req.user });
});

// Test AdminGrant model
router.get('/test-model', testAdminGrant);

// Create new subscriber with granted access
router.post('/subscribers', createSubscriber);

// Grant access to existing user
router.post('/grant-access', grantAccessToExistingUser);

// Search existing users
router.get('/search-users', searchExistingUsers);

// Get all admin-granted subscribers
router.get('/subscribers', getAdminGrantedSubscribers);

// Get specific subscriber details
router.get('/subscribers/:subscriberId', getSubscriberDetails);

// Update subscriber access
router.put('/subscribers/:subscriberId', updateSubscriberAccess);

// Delete subscriber
router.delete('/subscribers/:subscriberId', deleteSubscriber);

module.exports = router;