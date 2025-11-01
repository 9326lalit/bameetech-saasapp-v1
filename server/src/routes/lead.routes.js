const express = require('express');
const { getUserLeads, getAdminLeads, exportLeads } = require('../controllers/lead.controller');
// You are importing isSuperAdmin here
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// User routes
router.get('/user/leads', verifyToken, getUserLeads);

// Admin routes
// So you must use isSuperAdmin here
router.get('/admin/leads', verifyToken, isSuperAdmin, getAdminLeads);
router.get('/admin/leads/export', verifyToken, isSuperAdmin, exportLeads);

module.exports = router;

