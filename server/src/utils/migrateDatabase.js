const { sequelize } = require('../config/db.config');
const { User } = require('../models');

const migrateDatabase = async () => {
  try {
    console.log('🔄 Starting database migration...');
    
    // Force sync to add new columns
    await sequelize.sync({ alter: true, force: false });
    
    console.log('✅ Database migration completed successfully');
    
    // Test the new columns by querying a user
    try {
      const testUser = await User.findOne({ limit: 1 });
      if (testUser) {
        console.log('✅ New columns are accessible');
      }
    } catch (error) {
      console.log('⚠️  Testing new columns failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database migration failed:', error.message);
    throw error;
  }
};

module.exports = migrateDatabase;

// Run if called directly
if (require.main === module) {
  migrateDatabase()
    .then(() => {
      console.log('Migration completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}