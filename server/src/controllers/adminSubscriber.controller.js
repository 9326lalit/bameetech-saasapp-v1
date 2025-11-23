const { User, Plan, Subscription, AdminGrant } = require('../models');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize');

// Grant access to existing user
const grantAccessToExistingUser = async (req, res) => {
  try {
    const { userId, planIds, planDurations = {} } = req.body; // planDurations: { planId: days }
    const adminId = req.user.id;


    // Validate input
    if (!userId || !planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return res.status(400).json({ message: 'User ID and at least one plan must be provided' });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify all plan IDs exist
    const plans = await Plan.findAll({ where: { id: planIds } });
    if (plans.length !== planIds.length) {
      return res.status(400).json({ message: 'One or more invalid plan IDs' });
    }

    // Check if user already has admin grants
    let adminGrant = await AdminGrant.findOne({ where: { userId } });
    
    if (adminGrant) {
      // Update existing grant
      
      // Merge plan IDs (avoid duplicates)
      const existingPlanIds = adminGrant.planIds || [];
      const newPlanIds = [...new Set([...existingPlanIds, ...planIds])];
      
      adminGrant.planIds = newPlanIds;
      adminGrant.isActive = true;
      adminGrant.notes = `Updated by admin - now has access to ${newPlanIds.length} plan(s)`;
      await adminGrant.save();
    } else {
      // Create new grant
      adminGrant = await AdminGrant.create({
        userId,
        planIds,
        grantedBy: adminId,
        isActive: true,
        notes: `Admin-granted access to ${planIds.length} plan(s)`,
      });
    }

    // Remove existing admin-granted subscriptions to avoid duplicates
    await Subscription.destroy({
      where: {
        userId,
        paymentId: 'admin_granted'
      }
    });

    // Create new subscriptions for all granted plans
    const subscriptions = [];
    for (const planId of adminGrant.planIds) {
      // Get duration for this specific plan, default to 365 days if not specified
      const durationDays = planDurations[planId] || 365;
      const durationInMs = durationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      const subscription = await Subscription.create({
        userId,
        planId,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationInMs),
        status: 'active',
        amount: 0,
        paymentId: 'admin_granted',
        orderId: `admin_grant_${Date.now()}_${planId}`,
      });
      subscriptions.push(subscription);
    }

    res.status(200).json({
      message: 'Access granted successfully to existing user',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        grantedPlanIds: adminGrant.planIds,
        grantedAt: adminGrant.updatedAt,
      },
      subscriptions: subscriptions.length,
    });
  } catch (error) {
    console.error('❌ Error granting access to existing user:', error);
    res.status(500).json({ 
      message: 'Error granting access to existing user', 
      error: error.message 
    });
  }
};

// Search existing users
const searchExistingUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.findAll({
      where: {
        role: 'user',
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } }
        ]
      },
      attributes: { exclude: ['password'] },
      include: [{
        model: AdminGrant,
        as: 'AdminGrants',
        required: false
      }],
      limit: 10
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
      hasAdminGrant: user.AdminGrants && user.AdminGrants.length > 0,
      grantedPlanIds: user.AdminGrants && user.AdminGrants.length > 0 ? user.AdminGrants[0].planIds : []
    }));

    res.status(200).json({
      message: 'Users found',
      users: formattedUsers
    });
  } catch (error) {
    console.error('❌ Error searching users:', error);
    res.status(500).json({ 
      message: 'Error searching users', 
      error: error.message 
    });
  }
};

// Test AdminGrant model
const testAdminGrant = async (req, res) => {
  try {
    
    // Test if AdminGrant table exists and is accessible
    const testGrant = await AdminGrant.findAll({ limit: 1 });
    
    res.json({ 
      message: 'AdminGrant model test successful',
      grants: testGrant.length 
    });
  } catch (error) {
    console.error('❌ AdminGrant model test failed:', error);
    res.status(500).json({ 
      message: 'AdminGrant model test failed', 
      error: error.message 
    });
  }
};

// Create subscriber with admin-granted access
const createSubscriber = async (req, res) => {
  try {
    
    const { name, email, password, planIds, planDurations = {} } = req.body; // planDurations: { planId: days }
    const adminId = req.user.id;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!planIds || !Array.isArray(planIds) || planIds.length === 0) {
      return res.status(400).json({ message: 'At least one plan must be selected' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists',
        existingUser: {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role
        },
        suggestion: 'You can grant access to this existing user instead'
      });
    }

    // Verify all plan IDs exist
    const plans = await Plan.findAll({ where: { id: planIds } });
    if (plans.length !== planIds.length) {
      return res.status(400).json({ message: 'One or more invalid plan IDs' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create admin grant record
    const adminGrant = await AdminGrant.create({
      userId: user.id,
      planIds: planIds,
      grantedBy: adminId,
      isActive: true,
      notes: `Admin-granted access to ${planIds.length} plan(s)`,
    });

    // Create virtual subscriptions for granted plans
    const subscriptions = [];
    for (const planId of planIds) {
      const plan = plans.find(p => p.id === planId);
      // Get duration for this specific plan, default to 365 days if not specified
      const durationDays = planDurations[planId] || 365;
      const durationInMs = durationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      
      const subscription = await Subscription.create({
        userId: user.id,
        planId: planId,
        startDate: new Date(),
        endDate: new Date(Date.now() + durationInMs),
        status: 'active',
        amount: 0, // Admin granted, no payment
        paymentId: 'admin_granted',
        orderId: `admin_grant_${Date.now()}_${planId}`,
      });
      subscriptions.push(subscription);
    }

    res.status(201).json({
      message: 'Subscriber created successfully with granted access',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        isAdminGranted: true,
        grantedPlanIds: adminGrant.planIds,
        grantedAt: adminGrant.createdAt,
      },
      subscriptions: subscriptions.length,
    });
  } catch (error) {
    console.error('❌ Error creating subscriber:', error);
    res.status(500).json({ 
      message: 'Error creating subscriber', 
      error: error.message 
    });
  }
};

// Get all admin-granted subscribers
const getAdminGrantedSubscribers = async (req, res) => {
  try {
    const adminGrants = await AdminGrant.findAll({
      include: [{
        model: User,
        as: 'User',
        where: { role: 'user' },
        attributes: { exclude: ['password'] },
        include: [{
          model: Subscription,
          include: [{
            model: Plan,
            attributes: ['id', 'name', 'description', 'price']
          }]
        }]
      }],
      order: [['createdAt', 'DESC']]
    });

    // Get all valid plan IDs
    const allPlans = await Plan.findAll({ attributes: ['id'] });
    const validPlanIds = allPlans.map(p => p.id);

    const formattedSubscribers = adminGrants.map(grant => {
      // Filter out any invalid plan IDs
      const filteredPlanIds = (grant.planIds || []).filter(id => validPlanIds.includes(id));
      
      return {
        id: grant.User.id,
        name: grant.User.name,
        email: grant.User.email,
        isActive: grant.isActive && grant.User.isActive,
        grantedPlanIds: filteredPlanIds,
        grantedAt: grant.createdAt,
        createdAt: grant.User.createdAt,
        activeSubscriptions: grant.User.Subscriptions.filter(sub => 
          sub.status === 'active' && new Date(sub.endDate) > new Date()
        ).length,
        totalSubscriptions: grant.User.Subscriptions.length,
        plans: grant.User.Subscriptions.map(sub => sub.Plan).filter(Boolean),
        grantId: grant.id
      };
    });

    res.status(200).json({
      message: 'Admin-granted subscribers fetched successfully',
      subscribers: formattedSubscribers,
      total: formattedSubscribers.length
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching admin-granted subscribers', 
      error: error.message 
    });
  }
};

// Update subscriber's granted plans
const updateSubscriberAccess = async (req, res) => {
  try {
    const { subscriberId } = req.params;
    const { planIds, isActive, planDurations = {} } = req.body; // planDurations: { planId: days }
    const adminId = req.user.id;

    

    // Find admin grant record
    const adminGrant = await AdminGrant.findOne({
      where: { userId: subscriberId },
      include: [{
        model: User,
        as: 'User',
        where: { role: 'user' }
      }]
    });

    if (!adminGrant) {
      return res.status(404).json({ message: 'Admin-granted subscriber not found' });
    }

    const subscriber = adminGrant.User;

    // Update grant status if provided
    if (typeof isActive === 'boolean') {
      adminGrant.isActive = isActive;
      subscriber.isActive = isActive;
    }

    // Clean up any invalid plan IDs from existing grant
    const allPlans = await Plan.findAll({ attributes: ['id'] });
    const validPlanIds = allPlans.map(p => p.id);
    const currentPlanIds = (adminGrant.planIds || []).filter(id => validPlanIds.includes(id));
    
    // If current plan IDs were cleaned up, update the grant
    if (currentPlanIds.length !== (adminGrant.planIds || []).length) {
      adminGrant.planIds = currentPlanIds;
    }

    // Update granted plans if provided
    if (planIds && Array.isArray(planIds)) {
      
      // Verify all plan IDs exist
      const plans = await Plan.findAll({ where: { id: planIds } });
      
      if (plans.length !== planIds.length) {
        
        return res.status(400).json({ 
          message: 'One or more invalid plan IDs',
          requested: planIds,
          found: plans.map(p => p.id),
          missing: planIds.filter(id => !plans.find(p => p.id === id))
        });
      }

      // Update granted plan IDs
      adminGrant.planIds = planIds;

      // Remove existing admin-granted subscriptions
      await Subscription.destroy({
        where: {
          userId: subscriberId,
          paymentId: 'admin_granted'
        }
      });

      // Create new subscriptions for granted plans
      for (const planId of planIds) {
        // Get duration for this specific plan, default to 365 days if not specified
        const durationDays = planDurations[planId] || 365;
        const durationInMs = durationDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
        
        await Subscription.create({
          userId: subscriberId,
          planId: planId,
          startDate: new Date(),
          endDate: new Date(Date.now() + durationInMs),
          status: 'active',
          amount: 0,
          paymentId: 'admin_granted',
          orderId: `admin_grant_${Date.now()}_${planId}`,
        });
      }
    }

    await adminGrant.save();
    await subscriber.save();


    res.status(200).json({
      message: 'Subscriber access updated successfully',
      subscriber: {
        id: subscriber.id,
        name: subscriber.name,
        email: subscriber.email,
        isActive: subscriber.isActive,
        grantedPlanIds: adminGrant.planIds,
      }
    });
  } catch (error) {
    console.error('❌ Error updating subscriber access:', error);
    res.status(500).json({ 
      message: 'Error updating subscriber access', 
      error: error.message 
    });
  }
};

// Delete admin-granted subscriber
const deleteSubscriber = async (req, res) => {
  try {
    const { subscriberId } = req.params;

    const adminGrant = await AdminGrant.findOne({
      where: { userId: subscriberId },
      include: [{
        model: User,
        as: 'User',
        where: { role: 'user' }
      }]
    });

    if (!adminGrant) {
      return res.status(404).json({ message: 'Admin-granted subscriber not found' });
    }

    // Delete admin-granted subscriptions
    await Subscription.destroy({
      where: { 
        userId: subscriberId,
        paymentId: 'admin_granted'
      }
    });

    // Delete admin grant record
    await adminGrant.destroy();

    // Delete the user
    await adminGrant.User.destroy();

    res.status(200).json({
      message: 'Subscriber deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error deleting subscriber', 
      error: error.message 
    });
  }
};

// Get subscriber details
const getSubscriberDetails = async (req, res) => {
  try {
    const { subscriberId } = req.params;

    const adminGrant = await AdminGrant.findOne({
      where: { userId: subscriberId },
      include: [{
        model: User,
        as: 'User',
        where: { role: 'user' },
        include: [{
          model: Subscription,
          include: [{
            model: Plan,
            attributes: ['id', 'name', 'description', 'price']
          }]
        }],
        attributes: { exclude: ['password'] }
      }]
    });

    if (!adminGrant) {
      return res.status(404).json({ message: 'Admin-granted subscriber not found' });
    }

    const subscriber = adminGrant.User;

    res.status(200).json({
      message: 'Subscriber details fetched successfully',
      subscriber: {
        id: subscriber.id,
        name: subscriber.name,
        email: subscriber.email,
        isActive: subscriber.isActive,
        grantedPlanIds: adminGrant.planIds,
        grantedAt: adminGrant.createdAt,
        createdAt: subscriber.createdAt,
        subscriptions: subscriber.Subscriptions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error fetching subscriber details', 
      error: error.message 
    });
  }
};

module.exports = {
  testAdminGrant,
  createSubscriber,
  grantAccessToExistingUser,
  searchExistingUsers,
  getAdminGrantedSubscribers,
  updateSubscriberAccess,
  deleteSubscriber,
  getSubscriberDetails
};