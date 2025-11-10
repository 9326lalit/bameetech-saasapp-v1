const express = require('express');
const router = express.Router();
const { 
  getSubscriberResources, 
  getPlanResources, 
  downloadDocument 
} = require('../controllers/subscriberResource.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { checkPlanAccess } = require('../middlewares/checkPlanAccess');

// Get all subscriber resources
router.get('/my-resources', verifyToken, getSubscriberResources);

// Get specific plan resources (requires active subscription)
router.get('/plan/:planId/resources', verifyToken, checkPlanAccess, getPlanResources);

// Download plan document (requires active subscription)
router.get('/plan/:planId/document/:documentIndex', verifyToken, checkPlanAccess, downloadDocument);

module.exports = router;