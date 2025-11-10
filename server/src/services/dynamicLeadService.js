const { sequelize } = require('../config/db.config');
const { QueryTypes } = require('sequelize');

/**
 * Dynamic Lead Service
 * Uses existing Sequelize connection to manage dynamic lead tables
 * in the same database as the main application
 */

/**
 * Get all lead tables from database
 * @returns {Promise<Array>} List of table names ending with '_leads'
 */
const getAllLeadTables = async () => {
  try {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name LIKE '%_leads'
      ORDER BY table_name;
    `;
    
    const results = await sequelize.query(query, { type: QueryTypes.SELECT });
    return results.map(row => row.table_name);
  } catch (error) {
    console.error('Error fetching lead tables:', error);
    throw error;
  }
};

/**
 * Check if a table exists
 * @param {string} tableName - Name of the table
 * @returns {Promise<boolean>}
 */
const tableExists = async (tableName) => {
  try {
    const query = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = :tableName
      ) as exists;
    `;
    
    const results = await sequelize.query(query, {
      replacements: { tableName },
      type: QueryTypes.SELECT
    });
    
    return results[0].exists;
  } catch (error) {
    console.error('Error checking table existence:', error);
    throw error;
  }
};

/**
 * Get table columns
 * @param {string} tableName
 * @returns {Promise<Array>} Column information
 */
const getTableColumns = async (tableName) => {
  try {
    const query = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = :tableName
      ORDER BY ordinal_position;
    `;
    
    const results = await sequelize.query(query, {
      replacements: { tableName },
      type: QueryTypes.SELECT
    });
    
    return results;
  } catch (error) {
    console.error('Error fetching table columns:', error);
    throw error;
  }
};

/**
 * Create a new lead table dynamically
 * @param {string} tableName - Name of the table (from form_key)
 * @param {Object} sampleData - Sample data to infer columns
 * @returns {Promise<void>}
 */
const createLeadTable = async (tableName, sampleData) => {
  try {
    // Validate table name (security: prevent SQL injection)
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name. Only lowercase letters, numbers, and underscores allowed.');
    }
    
    // Start with base columns
    const columns = [
      'id SERIAL PRIMARY KEY',
      'created_at TIMESTAMP DEFAULT NOW()',
      'updated_at TIMESTAMP DEFAULT NOW()'
    ];
    
    // Add columns from sample data (excluding form_key)
    Object.keys(sampleData).forEach(key => {
      if (key !== 'form_key') {
        // Validate column name
        if (/^[a-z0-9_]+$/i.test(key)) {
          columns.push(`"${key}" TEXT`);
        }
      }
    });
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS "${tableName}" (
        ${columns.join(',\n        ')}
      );
    `;
    
    await sequelize.query(createTableQuery);
    
    // Create index on created_at for better query performance
    const createIndexQuery = `
      CREATE INDEX IF NOT EXISTS "idx_${tableName}_created_at" 
      ON "${tableName}"(created_at DESC);
    `;
    await sequelize.query(createIndexQuery);
    
    console.log(`✅ Table '${tableName}' created successfully`);
  } catch (error) {
    console.error(`Error creating table '${tableName}':`, error);
    throw error;
  }
};

/**
 * Add new columns to existing table
 * @param {string} tableName
 * @param {Array<string>} newColumns - Column names to add
 * @returns {Promise<void>}
 */
const addColumnsToTable = async (tableName, newColumns) => {
  try {
    for (const column of newColumns) {
      // Validate column name
      if (/^[a-z0-9_]+$/i.test(column)) {
        const alterQuery = `
          ALTER TABLE "${tableName}" 
          ADD COLUMN IF NOT EXISTS "${column}" TEXT;
        `;
        await sequelize.query(alterQuery);
      }
    }
    console.log(`✅ Added ${newColumns.length} new column(s) to '${tableName}'`);
  } catch (error) {
    console.error(`Error adding columns to '${tableName}':`, error);
    throw error;
  }
};

/**
 * Insert lead data into table
 * @param {string} tableName
 * @param {Object} leadData
 * @returns {Promise<Object>} Inserted row
 */
const insertLead = async (tableName, leadData) => {
  try {
    // Remove form_key from data
    const { form_key, ...data } = leadData;
    
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    // Build parameterized query
    const placeholders = columns.map((_, i) => `:value${i}`).join(', ');
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    const insertQuery = `
      INSERT INTO "${tableName}" (${columnNames})
      VALUES (${placeholders})
      RETURNING *;
    `;
    
    // Create replacements object
    const replacements = {};
    values.forEach((val, i) => {
      replacements[`value${i}`] = val;
    });
    
    const results = await sequelize.query(insertQuery, {
      replacements,
      type: QueryTypes.INSERT
    });
    
    return results[0][0]; // Return the inserted row
  } catch (error) {
    console.error(`Error inserting lead into '${tableName}':`, error);
    throw error;
  }
};

/**
 * Get all leads from a table
 * @param {string} tableName
 * @param {number} limit - Optional limit
 * @returns {Promise<Array>}
 */
const getLeadsFromTable = async (tableName, limit = null) => {
  try {
    // Validate table name
    if (!/^[a-z0-9_]+$/.test(tableName)) {
      throw new Error('Invalid table name');
    }
    
    let query = `SELECT * FROM "${tableName}" ORDER BY created_at DESC`;
    if (limit && !isNaN(limit)) {
      query += ` LIMIT ${parseInt(limit)}`;
    }
    
    const results = await sequelize.query(query, { type: QueryTypes.SELECT });
    return results;
  } catch (error) {
    console.error(`Error fetching leads from '${tableName}':`, error);
    throw error;
  }
};

/**
 * Process webhook data and store in appropriate table
 * Main function called by webhook endpoint
 * @param {Object} webhookData - Data from Elementor form
 * @returns {Promise<Object>} Result with table name and inserted data
 */
const processWebhookLead = async (webhookData) => {
  try {
    const { form_key } = webhookData;
    
    if (!form_key) {
      throw new Error('form_key is required');
    }
    
    // Validate form_key format
    if (!/^[a-z0-9_]+$/.test(form_key)) {
      throw new Error('Invalid form_key format. Only lowercase letters, numbers, and underscores allowed.');
    }
    
    // Check if table exists
    const exists = await tableExists(form_key);
    
    if (!exists) {
      // Create new table
      console.log(`📝 Creating new table: ${form_key}`);
      await createLeadTable(form_key, webhookData);
    } else {
      // Check if we need to add new columns
      const existingColumns = await getTableColumns(form_key);
      const existingColumnNames = existingColumns.map(col => col.column_name);
      
      const newColumns = Object.keys(webhookData)
        .filter(key => key !== 'form_key' && !existingColumnNames.includes(key));
      
      if (newColumns.length > 0) {
        console.log(`📝 Adding ${newColumns.length} new column(s) to ${form_key}`);
        await addColumnsToTable(form_key, newColumns);
      }
    }
    
    // Insert the lead
    const insertedLead = await insertLead(form_key, webhookData);
    
    return {
      success: true,
      tableName: form_key,
      lead: insertedLead,
      message: 'Lead stored successfully'
    };
  } catch (error) {
    console.error('Error processing webhook lead:', error);
    throw error;
  }
};

module.exports = {
  getAllLeadTables,
  tableExists,
  getTableColumns,
  createLeadTable,
  addColumnsToTable,
  insertLead,
  getLeadsFromTable,
  processWebhookLead
};
