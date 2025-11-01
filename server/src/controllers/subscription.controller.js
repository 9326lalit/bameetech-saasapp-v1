const { Subscription, Plan, User, LeadDatabase } = require('../models');
const { Op } = require('sequelize');

const createDirectSubscription = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user.id;
    
    console.log('Creating subscription for user:', userId, 'plan:', planId);
    
    // Validate input
    if (!planId) {
      return res.status(400).json({ message: 'Plan ID is required' });
    }
    
    // Get the plan details
    const plan = await Plan.findByPk(planId);
    if (!plan) {
      console.log('Plan not found:', planId);
      return res.status(404).json({ message: 'Plan not found' });
    }
    
    console.log('Found plan:', plan.name);
    
    // Check if user already has this specific plan active
    const existingPlanSubscription = await Subscription.findOne({
      where: {
        userId,
        planId,
        status: 'active',
        endDate: {
          [Op.gte]: new Date(),
        },
      },
    });
    
    if (existingPlanSubscription) {
      console.log('User already has active subscription for this plan');
      return res.status(400).json({ message: 'You already have an active subscription for this plan' });
    }
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);
    
    console.log('Creating subscription with dates:', { startDate, endDate });
    
    // Create subscription
    const subscription = await Subscription.create({
      userId,
      planId,
      status: 'active',
      startDate,
      endDate,
      amount: plan.price
    });
    
    console.log('Subscription created successfully:', subscription.id);
    
    res.status(201).json({
      message: 'Subscription created successfully',
      subscription: {
        ...subscription.toJSON(),
        Plan: plan
      }
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ message: 'Error creating subscription', error: error.message });
  }
};

const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gte]: new Date(),
        },
      },
      include: [{
        model: Plan
      }]
    });
    
    if (!subscription) {
      return res.status(404).json({ message: 'No active subscription found' });
    }
    
    res.status(200).json(subscription);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subscription', error: error.message });
  }
};

const getAllUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('Fetching subscriptions for user:', userId);
    
    const subscriptions = await Subscription.findAll({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gte]: new Date(),
        },
      },
      include: [{
        model: Plan,
        include: [{
          model: LeadDatabase
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    
    console.log('Found subscriptions:', subscriptions.length);
    
    res.status(200).json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ message: 'Error fetching subscriptions', error: error.message });
  }
};

module.exports = {
  createDirectSubscription,
  getUserSubscription,
  getAllUserSubscriptions
};