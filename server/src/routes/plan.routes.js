const express = require('express');
const { createPlan, getAllPlans, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');

const router = express.Router();

// Public route to get all active plans
router.get('/', getAllPlans);

// Super Admin routes
router.post('/', verifyToken, isSuperAdmin, upload.array('documents', 5), createPlan);
router.put('/:id', verifyToken, isSuperAdmin, upload.array('documents', 5), updatePlan);
router.delete('/:id', verifyToken, isSuperAdmin, deletePlan);

module.exports = router;