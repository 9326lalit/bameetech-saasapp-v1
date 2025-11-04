const express = require('express');
const cors = require('cors');
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

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/plans', require('./routes/plan.routes'));
app.use('/api/payment', require('./routes/payment.routes'));
app.use('/', require('./routes/lead.routes'));
app.use('/', require('./routes/user.routes'));
app.use('/admin', require('./routes/leadDatabase.routes'));
app.use('/subscription', require('./routes/subscription.routes'));
app.use('/api/razorpay', require('./routes/razorpay.routes.js'));

// Test database connection
testConnection();

// Sync database + seeders + then start cron
syncDatabase().then(async () => {
  await createSuperAdmin();
  await createDemoLeadDatabases();
  await createSampleLeads();

  console.log('All models were synchronized successfully.');

  // ✅ Start reminder job only after DB is ready
  subscriptionReminderJob();
  console.log('🕒 Subscription reminder job started...');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
