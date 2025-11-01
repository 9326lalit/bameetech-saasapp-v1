const express = require('express');
const {
  getAllLeadDatabases,
  createLeadDatabase,
  updateLeadDatabase,
  deleteLeadDatabase,
  testDatabaseConnection
} = require('../controllers/leadDatabase.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');

const router = express.Router();

// All routes require super admin access
router.get('/lead-databases', verifyToken, isSuperAdmin, getAllLeadDatabases);
router.post('/lead-databases', verifyToken, isSuperAdmin, createLeadDatabase);
router.put('/lead-databases/:id', verifyToken, isSuperAdmin, updateLeadDatabase);
router.delete('/lead-databases/:id', verifyToken, isSuperAdmin, deleteLeadDatabase);
router.post('/lead-databases/test-connection', verifyToken, isSuperAdmin, testDatabaseConnection);

module.exports = router;