const { sequelize } = require('../config/db.config');

const resetDatabase = async () => {
  try {
    console.log('🔄 Resetting database...');
    
    // This will drop all tables and recreate them
    await sequelize.sync({ force: true });
   
    
  } catch (error) {
    console.error('❌ Database reset failed:', error.message);
    throw error;
  }
};

module.exports = resetDatabase;

// Run if called directly
if (require.main === module) {
  resetDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Reset failed:', error);
      process.exit(1);
    });
}