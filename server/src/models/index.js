const User = require('./user.model');
const Plan = require('./plan.model');
const Subscription = require('./subscription.model');
const Payment = require('./payment.model');
const Lead = require('./lead.model');
const LeadDatabase = require('./leadDatabase.model');
const AdminGrant = require('./adminGrant.model');
const OTP = require('./otp.model');
const ContentAccess = require('./contentAccess.model');
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

// Admin Grant associations
User.hasMany(AdminGrant, { foreignKey: 'userId', as: 'AdminGrants' });
AdminGrant.belongsTo(User, { foreignKey: 'userId', as: 'User' });
AdminGrant.belongsTo(User, { foreignKey: 'grantedBy', as: 'GrantedByAdmin' });

// Content Access associations
User.hasMany(ContentAccess, { foreignKey: 'userId', as: 'ContentAccess' });
ContentAccess.belongsTo(User, { foreignKey: 'userId', as: 'User' });
Plan.hasMany(ContentAccess, { foreignKey: 'planId', as: 'ContentAccess' });
ContentAccess.belongsTo(Plan, { foreignKey: 'planId', as: 'Plan' });

// Sync all models with database
const syncDatabase = async () => {
  try {
    // Sync in order: first base tables, then tables with foreign keys
    await User.sync({ alter: false });
    await Plan.sync({ alter: false });
    await LeadDatabase.sync({ alter: false });
    await Subscription.sync({ alter: false });
    await Payment.sync({ alter: false });
    await Lead.sync({ alter: false });
    await AdminGrant.sync({ alter: false });
    await OTP.sync({ alter: false });
    await ContentAccess.sync({ alter: false });
    
    console.log('All models were synchronized successfully.');
  } catch (error) {
    console.error('Error synchronizing models:', error);
    throw error;
  }
};

module.exports = {
  User,
  Plan,
  Subscription,
  Payment,
  Lead,
  LeadDatabase,
  AdminGrant,
  OTP,
  ContentAccess,
  syncDatabase,
};