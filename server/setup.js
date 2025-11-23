const { syncDatabase } = require('./src/models');
const { testConnection } = require('./src/config/db.config');
const createSuperAdmin = require('./src/seeders/createSuperAdmin');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase();
    
    // Create super admin
    await createSuperAdmin();
    
    console.log('🎉 Your BameeTech SaaS application is ready!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
};

setupDatabase();
