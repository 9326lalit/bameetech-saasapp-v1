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
// app.use(cors());
// app.use(cors({
//   origin: 'http://147.79.71.235',
//   credentials: true
// }));
app.use(cors({
    origin: [
    "https://dashboard.bameetech.in",
    "http://localhost:5173",
    "http://localhost:5174",
    "https://bameetech.in/",
    "https://bindhastkatta.com/",
    "https://balajikanthekar.com/",
    "https://cornflowerblue-curlew-414242.hostingersite.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true
}));

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
    
    // Sync Plan table to add leadTables and contentUrls columns
    await Plan.sync({ alter: true });
    
    // Sync ContentAccess table
    await ContentAccess.sync({ alter: true });
    
    await createSuperAdmin();
    await createDemoLeadDatabases();
    await createSampleLeads();


    // ✅ Start reminder job only after DB is ready
    subscriptionReminderJob();
  } catch (error) {
    console.error('❌ Error in seeding process:', error.message);
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
