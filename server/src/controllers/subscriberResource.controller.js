const { Plan, Subscription, LeadDatabase, AdminGrant } = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// Get subscriber's plan resources
const getSubscriberResources = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all active subscriptions with plan details
    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        status: 'active',
        endDate: { [Op.gte]: new Date() }
      },
      include: [{
        model: Plan,
        include: [{
          model: LeadDatabase
        }]
      }]
    });

    if (!subscriptions.length) {
      return res.status(404).json({ message: 'No active subscriptions found' });
    }

    // Format response with accessible resources
    const resources = subscriptions.map(sub => ({
      subscriptionId: sub.id,
      planId: sub.planId,
      planName: sub.Plan.name,
      planDescription: sub.Plan.description,
      endDate: sub.endDate,
      htmlContent: sub.Plan.htmlContent,
      documents: sub.Plan.documents || [],
      leadDatabase: sub.Plan.LeadDatabase ? {
        id: sub.Plan.LeadDatabase.id,
        name: sub.Plan.LeadDatabase.name,
        description: sub.Plan.LeadDatabase.description
      } : null,
      leadLimit: sub.Plan.leadLimit,
      isAdminGranted: sub.paymentId === 'admin_granted'
    }));

    // Check if user has admin grants
    const adminGrant = await AdminGrant.findOne({
      where: { userId, isActive: true }
    });

    res.status(200).json({
      message: 'Subscriber resources fetched successfully',
      resources,
      isAdminGrantedUser: !!adminGrant
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching subscriber resources', 
      error: error.message 
    });
  }
};

// Get specific plan resources (with access check)
const getPlanResources = async (req, res) => {
  try {
    const plan = req.plan; // Set by checkPlanAccess middleware
    const subscription = req.subscription;

    const resources = {
      subscriptionId: subscription.id,
      planId: plan.id,
      planName: plan.name,
      planDescription: plan.description,
      endDate: subscription.endDate,
      htmlContent: plan.htmlContent,
      documents: plan.documents || [],
      leadDatabase: plan.LeadDatabase ? {
        id: plan.LeadDatabase.id,
        name: plan.LeadDatabase.name,
        description: plan.LeadDatabase.description
      } : null,
      leadLimit: plan.leadLimit
    };

    res.status(200).json({
      message: 'Plan resources fetched successfully',
      resources
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching plan resources', 
      error: error.message 
    });
  }
};

// Download plan document
const downloadDocument = async (req, res) => {
  try {
    const { documentIndex } = req.params;
    const plan = req.plan; // Set by checkPlanAccess middleware

    if (!plan.documents || !plan.documents[documentIndex]) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const document = plan.documents[documentIndex];
    const filePath = path.join(__dirname, '../../uploads', document.filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Set appropriate headers
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalName}"`);
    res.setHeader('Content-Type', document.mimetype);

    // Send file
    res.sendFile(filePath);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error downloading document', 
      error: error.message 
    });
  }
};

module.exports = {
  getSubscriberResources,
  getPlanResources,
  downloadDocument
};