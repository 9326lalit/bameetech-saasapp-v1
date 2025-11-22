const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { syncDatabase } = require('./models');
const { testConnection } = require('./config/db.config');
const createSuperAdmin = require('./seeders/createSuperAdmin');
const createDemoLeadDatabases = require('./seeders/createDemoLeadDatabases');
const createSampleLeads = require('./seeders/createSampleLeads');
const { subscriptionReminderJob } = require('./utils/subscriptionReminderJob.js');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/otp', require('./routes/otp.routes'));
app.use('/api/content', require('./routes/contentProxy.routes'));
app.use('/plans', require('./routes/plan.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/api', require('./routes/lead.routes')); // Changed from '/' to '/api'
app.use('/', require('./routes/user.routes'));
app.use('/admin', require('./routes/leadDatabase.routes'));
app.use('/admin', require('./routes/adminSubscriber.routes'));
app.use('/subscription', require('./routes/subscription.routes'));
app.use('/subscriber', require('./routes/subscriberResource.routes'));
app.use('/api/razorpay', require('./routes/razorpay.routes.js'));

// Test database connection
testConnection();

// Sync database + seeders + then start cron
syncDatabase().then(async () => {
  try {
    // Force sync specific tables
    const { AdminGrant, Plan, ContentAccess } = require('./models');
    await AdminGrant.sync({ alter: true });
    console.log('✅ AdminGrant table synced successfully');
    
    // Sync Plan table to add leadTables and contentUrls columns
    await Plan.sync({ alter: true });
    console.log('✅ Plan table synced (leadTables and contentUrls columns added if needed)');
    
    // Sync ContentAccess table
    await ContentAccess.sync({ alter: true });
    console.log('✅ ContentAccess table synced successfully');
    
    await createSuperAdmin();
    await createDemoLeadDatabases();
    await createSampleLeads();

    console.log('✅ Database initialization completed successfully.');

    // ✅ Start reminder job only after DB is ready
    subscriptionReminderJob();
    console.log('🕒 Subscription reminder job started...');
  } catch (error) {
    console.error('❌ Error in seeding process:', error.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
