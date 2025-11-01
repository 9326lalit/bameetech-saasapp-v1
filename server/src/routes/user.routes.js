const express = require('express');
const { getAllUsers, getDashboardStats } = require('../controllers/user.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// Super Admin routes
router.get('/super-admin/users', verifyToken, isSuperAdmin, getAllUsers);
router.get('/super-admin/dashboard', verifyToken, isSuperAdmin, getDashboardStats);

// Keep old routes for backward compatibility
router.get('/admin/users', verifyToken, isSuperAdmin, getAllUsers);
router.get('/admin/dashboard', verifyToken, isSuperAdmin, getDashboardStats);

module.exports = router;