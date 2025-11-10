const express = require('express');
const { createPlan, getAllPlans, updatePlan, deletePlan } = require('../controllers/plan.controller');
const { verifyToken, isSuperAdmin } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const { cleanupExistingHtmlContent } = require('../utils/cleanupHtmlContent');

const router = express.Router();

// Public route to get all active plans
router.get('/', getAllPlans);

// Super Admin routes
router.post('/', verifyToken, isSuperAdmin, upload.array('documents', 5), createPlan);
router.put('/:id', verifyToken, isSuperAdmin, upload.array('documents', 5), updatePlan);
router.delete('/:id', verifyToken, isSuperAdmin, deletePlan);

// Cleanup HTML content
router.post('/cleanup-html', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const result = await cleanupExistingHtmlContent();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test HTML validation
router.post('/test-html', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { htmlContent } = req.body;
    const { validateHtmlContent, sanitizeHtmlContent } = require('../utils/htmlSanitizer');
    
    const validation = validateHtmlContent(htmlContent);
    const sanitized = sanitizeHtmlContent(htmlContent);
    
    res.json({
      isValid: validation.isValid,
      message: validation.message,
      original: htmlContent,
      sanitized: sanitized,
      changes: htmlContent !== sanitized
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Debug endpoint to test plan creation data
router.post('/debug-create', verifyToken, isSuperAdmin, upload.array('documents', 5), async (req, res) => {
  try {
    console.log('🔍 Debug create plan request');
    console.log('📋 Headers:', req.headers);
    console.log('📋 Body:', req.body);
    console.log('📁 Files:', req.files);
    
    res.json({
      success: true,
      receivedBody: req.body,
      receivedFiles: req.files ? req.files.length : 0,
      contentType: req.headers['content-type']
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simple test endpoint without file upload
router.post('/test-simple', verifyToken, isSuperAdmin, async (req, res) => {
  try {
    const { Plan } = require('../models');
    
    const testPlan = {
      name: 'Test Plan ' + Date.now(),
      description: 'Test Description',
      price: 99.99,
      duration: 30,
      features: ['Feature 1', 'Feature 2'],
      isActive: true
    };
    
    const plan = await Plan.create(testPlan);
    
    res.json({
      success: true,
      message: 'Test plan created successfully',
      planId: plan.id
    });
  } catch (error) {
    console.error('Test plan creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;