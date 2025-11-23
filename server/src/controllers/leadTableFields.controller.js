const { sequelize } = require('../config/db.config');

// Get available fields for a specific lead table
const getTableFields = async (req, res) => {
  try {
    const { tableName } = req.params;
    
    
    let fields = [];
    const dialect = sequelize.getDialect();
    
    // Try to get a sample record first (works for all databases)
    try {
      const [results] = await sequelize.query(
        `SELECT * FROM ${tableName} LIMIT 1`
      );
      
      if (results && results.length > 0) {
        // Get field names from the first record
        fields = Object.keys(results[0]).filter(key => 
          // Exclude system fields
          !['id', 'created_at', 'updated_at'].includes(key.toLowerCase())
        );
        
      }
    } catch (sampleError) {
      console.log('⚠️ No sample record found, trying schema query...');
    }
    
    // If no sample record, get table structure based on database dialect
    if (fields.length === 0) {
      try {
        let schemaQuery;
        
        switch (dialect) {
          case 'sqlite':
            schemaQuery = `PRAGMA table_info(${tableName})`;
            break;
            
          case 'postgres':
            schemaQuery = `
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = '${tableName}'
              AND column_name NOT IN ('id', 'created_at', 'updated_at')
              ORDER BY ordinal_position
            `;
            break;
            
          case 'mysql':
          case 'mariadb':
            schemaQuery = `
              SELECT COLUMN_NAME as column_name
              FROM INFORMATION_SCHEMA.COLUMNS
              WHERE TABLE_NAME = '${tableName}'
              AND COLUMN_NAME NOT IN ('id', 'created_at', 'updated_at')
              ORDER BY ORDINAL_POSITION
            `;
            break;
            
          default:
            throw new Error(`Unsupported database dialect: ${dialect}`);
        }
        
        const [schemaResults] = await sequelize.query(schemaQuery);
        
        if (dialect === 'sqlite') {
          // SQLite returns different structure
          fields = schemaResults
            .filter(col => !['id', 'created_at', 'updated_at'].includes(col.name.toLowerCase()))
            .map(col => col.name);
        } else {
          // PostgreSQL and MySQL return column_name
          fields = schemaResults.map(row => row.column_name);
        }
        
        console.log(`✅ Found ${fields.length} fields from schema:`, fields);
      } catch (schemaError) {
        console.error('Error fetching schema:', schemaError);
        throw new Error(`Could not fetch table structure: ${schemaError.message}`);
      }
    }
    
    res.status(200).json({
      success: true,
      tableName,
      fields,
      dialect
    });
  } catch (error) {
    console.error('Error fetching table fields:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching table fields',
      error: error.message,
      hint: 'Make sure the table exists and has at least one record, or check database permissions'
    });
  }
};

module.exports = {
  getTableFields
};
