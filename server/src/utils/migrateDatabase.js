const { sequelize } = require('../config/db.config');
const { User } = require('../models');

const migrateDatabase = async () => {
  try {    
    // Force sync to add new columns
    await sequelize.sync({ alter: true, force: false });
    // Test the new columns by querying a user
    try {
      const testUser = await User.findOne({ limit: 1 });
      if (testUser) {
      }
    } catch (error) {
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