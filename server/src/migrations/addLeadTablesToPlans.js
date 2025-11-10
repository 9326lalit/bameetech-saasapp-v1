const { sequelize } = require('../config/db.config');
const { QueryTypes } = require('sequelize');

/**
 * Migration to add leadTables column to Plans table
 * Run this to update existing database
 */
const addLeadTablesToPlans = async () => {
  try {
    console.log('🔄 Starting migration: Add leadTables column to Plans...');
    
    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'plans' 
      AND column_name = 'leadTables';
    `;
    
    const results = await sequelize.query(checkQuery, { type: QueryTypes.SELECT });
    
    if (results.length > 0) {
      console.log('✅ Column leadTables already exists. Skipping migration.');
      return { success: true, message: 'Column already exists' };
    }
    
    // Add the column
    const alterQuery = `
      ALTER TABLE plans 
      ADD COLUMN "leadTables" JSONB DEFAULT '[]'::jsonb;
    `;
    
    await sequelize.query(alterQuery);
    
    console.log('✅ Migration completed: leadTables column added successfully');
    console.log('📝 Note: Existing plans will have empty leadTables array by default');
    
    return { success: true, message: 'Column added successfully' };
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  addLeadTablesToPlans()
    .then((result) => {
      console.log('✅ Migration script completed:', result.message);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addLeadTablesToPlans;
