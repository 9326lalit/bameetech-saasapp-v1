const express = require('express');
const { 
  getUserLeads, 
  getUserLeadsOverview, 
  getPlanLeads, 
  getAdminLeads, 
  exportLeads,
  collectLeadWebhook,
  getAvailableLeadTables,
  getLeadsFromDynamicTable
} = require('../controllers/lead.controller');
const { getTableFields } = require('../controllers/leadTableFields.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');
const { checkPlanAccess } = require('../middlewares/checkPlanAccess');

const router = express.Router();

// Webhook endpoint (no auth - called by Elementor)
router.post('/collect-lead', collectLeadWebhook);

// User routes
router.get('/user/leads', verifyToken, getUserLeads); // Legacy endpoint
router.get('/user/leads-overview', verifyToken, getUserLeadsOverview); // Get all subscriptions with lead access
router.get('/user/plan/:planId/leads', verifyToken, checkPlanAccess, getPlanLeads); // Get leads for specific plan

// Admin routes
router.get('/admin/leads', verifyToken, isSuperAdmin, getAdminLeads);
router.get('/admin/leads/export', verifyToken, isSuperAdmin, exportLeads);
router.get('/admin/lead-tables', verifyToken, isSuperAdmin, getAvailableLeadTables); // Get all available lead tables
router.get('/admin/lead-tables/:tableName', verifyToken, isSuperAdmin, getLeadsFromDynamicTable); // Get leads from specific table
router.get('/admin/lead-tables/:tableName/fields', verifyToken, isSuperAdmin, getTableFields); // Get fields for a specific table

module.exports = router;

