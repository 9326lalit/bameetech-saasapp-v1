const express = require('express');
const cors = require('cors');
const { syncDatabase } = require('./models');
const { testConnection } = require('./config/db.config');
const createSuperAdmin = require('./seeders/createSuperAdmin');
const createDemoLeadDatabases = require('./seeders/createDemoLeadDatabases');
const createSampleLeads = require('./seeders/createSampleLeads');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/plans', require('./routes/plan.routes'));
app.use('/payment', require('./routes/payment.routes'));
app.use('/', require('./routes/lead.routes'));
app.use('/', require('./routes/user.routes'));
app.use('/admin', require('./routes/leadDatabase.routes'));
app.use('/subscription', require('./routes/subscription.routes'));

// Test database connection test
testConnection();

// Sync database models and create super admin
syncDatabase().then(async () => {
  // Create super admin and demo data after database sync
  await createSuperAdmin();
  await createDemoLeadDatabases();
  await createSampleLeads();
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});