const { Subscription, Plan, LeadDatabase } = require('../models');
const { Op } = require('sequelize');

const checkPlanAccess = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const planId = req.params.planId || req.body.planId || req.query.planId;

    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }

    // Check if user has active subscription for this plan
    const subscription = await Subscription.findOne({
      where: {
        userId,
        planId,
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

    if (!subscription) {
      return res.status(403).json({ 
        message: 'Access denied. You need an active subscription for this plan.' 
      });
    }

    req.subscription = subscription;
    req.plan = subscription.Plan;
    next();
  } catch (error) {
    return res.status(500).json({ 
      message: 'Error checking plan access', 
      error: error.message 
    });
  }
};

module.exports = { checkPlanAccess };