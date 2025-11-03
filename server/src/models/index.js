const User = require('./user.model');
const Plan = require('./plan.model');
const Subscription = require('./subscription.model');
const Payment = require('./payment.model');
const Lead = require('./lead.model');
const LeadDatabase = require('./leadDatabase.model');
const { sequelize } = require('../config/db.config');

// Define associations
User.hasMany(Subscription, { foreignKey: 'userId' });
Subscription.belongsTo(User, { foreignKey: 'userId' });

Plan.hasMany(Subscription, { foreignKey: 'planId' });
Subscription.belongsTo(Plan, { foreignKey: 'planId' });

User.hasMany(Payment, { foreignKey: 'userId' });
Payment.belongsTo(User, { foreignKey: 'userId' });

Subscription.hasMany(Payment, { foreignKey: 'subscriptionId' });
Payment.belongsTo(Subscription, { foreignKey: 'subscriptionId' });

// Lead Database associations
Plan.belongsTo(LeadDatabase, { foreignKey: 'leadDatabaseId' });
LeadDatabase.hasMany(Plan, { foreignKey: 'leadDatabaseId' });

// Sync all models with database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: false });
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
  }
};

module.exports = {
  User,
  Plan,
  Subscription,
  Payment,
  Lead,
  LeadDatabase,
  syncDatabase,
};