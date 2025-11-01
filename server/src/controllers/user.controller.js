const { User, Subscription, Payment, Plan } = require('../models');
const { Op } = require('sequelize');

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Subscription,
          include: [Plan],
        },
      ],
    });
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    // Get total users
    const totalUsers = await User.count({
      where: { role: 'user' },
    });
    
    // Get active subscriptions
    const activePlans = await Subscription.count({
      where: {
        status: 'active',
        endDate: {
          [Op.gte]: new Date(),
        },
      },
    });
    
    // Get total revenue
    const payments = await Payment.findAll({
      where: { status: 'completed' },
      attributes: ['amount'],
    });
    
    const totalRevenue = payments.reduce((sum, payment) => sum + payment.amount, 0);
    
    // Get recent payments
    const recentPayments = await Payment.findAll({
      where: { status: 'completed' },
      limit: 5,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
        },
      ],
    });
    
    res.status(200).json({
      totalUsers,
      activePlans,
      totalRevenue,
      recentPayments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
  }
};

module.exports = {
  getAllUsers,
  getDashboardStats,
};