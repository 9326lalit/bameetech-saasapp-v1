const { syncDatabase } = require('./src/models');
const { testConnection } = require('./src/config/db.config');
const createSuperAdmin = require('./src/seeders/createSuperAdmin');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🚀 Starting BameeTech SaaS Setup...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await testConnection();
    
    // Sync database models
    console.log('🔄 Synchronizing database models...');
    await syncDatabase();
    
    // Create super admin
    console.log('👤 Creating super admin user...');
    await createSuperAdmin();
    
    console.log('✅ Setup completed successfully!');
    console.log('');
    console.log('🎉 Your BameeTech SaaS application is ready!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Configure Gmail for OTP: Update EMAIL_USER and EMAIL_PASSWORD in .env');
    console.log('2. Start the server: npm run dev');
    console.log('3. Access admin panel with the super admin credentials');
    console.log('4. Create your first lead database and plan');
    console.log('');
    console.log('📚 Documentation:');
    console.log('- OTP Setup: OTP_SETUP_GUIDE.md');
    console.log('- API Docs: API_DOCUMENTATION.md');
    console.log('- Quick Start: QUICK_START.md');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('');
    console.log('💡 Try running the setup again after fixing the issue.');
    process.exit(1);
  }
};

setupDatabase();
