const { sequelize } = require('../config/db.config');
const { QueryTypes } = require('sequelize');

/**
 * Migration to add leadTables column to Plans table
 * Run this to update existing database
 */
const addLeadTablesToPlans = async () => {
  try {
    
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
      return { success: true, message: 'Column already exists' };
    }
    
    // Add the column
    const alterQuery = `
      ALTER TABLE plans 
      ADD COLUMN "leadTables" JSONB DEFAULT '[]'::jsonb;
    `;
    
    await sequelize.query(alterQuery);
    
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
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = addLeadTablesToPlans;
