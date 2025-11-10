const mysql = require('mysql2/promise');

// Cache for failed connection attempts to avoid repeated errors
const failedConnectionCache = new Map();
const CACHE_DURATION = 60000; // 1 minute

/**
 * Create a connection to an external lead database
 * @param {Object} dbConfig - Database configuration
 * @returns {Promise<Connection>} MySQL connection
 */
const createLeadDatabaseConnection = async (dbConfig) => {
  // Check if this connection recently failed
  const cacheKey = `${dbConfig.host}:${dbConfig.port}:${dbConfig.database}`;
  const cachedFailure = failedConnectionCache.get(cacheKey);
  
  if (cachedFailure && Date.now() - cachedFailure.timestamp < CACHE_DURATION) {
    // Return cached error to avoid repeated connection attempts
    const error = new Error('Connection recently failed (cached)');
    error.code = cachedFailure.code;
    throw error;
  }
  
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port || 3306,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
      connectTimeout: 10000 // 10 seconds timeout
    });
    
    // Clear any cached failure on successful connection
    failedConnectionCache.delete(cacheKey);
    
    return connection;
  } catch (error) {
    // Cache the failure
    failedConnectionCache.set(cacheKey, {
      code: error.code || 'CONNECTION_ERROR',
      timestamp: Date.now()
    });
    
    // Re-throw with the original error code for proper handling upstream
    error.code = error.code || 'CONNECTION_ERROR';
    throw error;
  }
};

/**
 * Fetch leads from external database
 * @param {Object} leadDatabase - LeadDatabase model instance
 * @param {Number} limit - Maximum number of leads to fetch
 * @returns {Promise<Array>} Array of leads
 */
const fetchLeadsFromExternalDatabase = async (leadDatabase, limit = null) => {
  let connection = null;
  
  try {
    // Create connection to external database
    connection = await createLeadDatabaseConnection({
      host: leadDatabase.host,
      port: leadDatabase.port,
      username: leadDatabase.username,
      password: leadDatabase.password,
      database: leadDatabase.database
    });
    
    // Get field mappings
    const fieldMappings = leadDatabase.fieldMappings || {
      name: 'name',
      email: 'email',
      mobile: 'mobile',
      website: 'website',
      business: 'business',
      company: 'company',
      status: 'status'
    };
    
    // Build SELECT query with field mappings
    const selectFields = Object.entries(fieldMappings)
      .map(([key, dbField]) => `${dbField} as ${key}`)
      .join(', ');
    
    // Build query with optional limit
    let query = `SELECT ${selectFields} FROM ${leadDatabase.tableName}`;
    if (limit) {
      query += ` LIMIT ${limit}`;
    }
    
    // Execute query
    const [rows] = await connection.execute(query);
    
    // Transform rows to standardized lead format
    const leads = rows.map((row, index) => ({
      id: index + 1,
      name: row.name || 'N/A',
      email: row.email || 'N/A',
      mobile: row.mobile || row.phone || 'N/A',
      website: row.website || null,
      business: row.business || 'N/A',
      company: row.company || row.name || 'N/A',
      status: row.status || 'new',
      source: leadDatabase.name,
      notes: row.notes || '',
      createdAt: row.createdAt || row.created_at || new Date(),
      lastContact: row.lastContact || row.last_contact || null
    }));
    
    console.log(`✓ Successfully fetched ${leads.length} leads from external database: ${leadDatabase.name}`);
    return leads;
  } catch (error) {
    // Log a concise error message (only if not cached)
    const errorType = error.code === 'ECONNREFUSED' ? 'Connection refused' : 
                      error.code === 'ENOTFOUND' ? 'Host not found' :
                      error.code === 'ER_ACCESS_DENIED_ERROR' ? 'Access denied' :
                      'Connection error';
    
    // Only log if this is not a cached error
    if (error.message !== 'Connection recently failed (cached)') {
      console.log(`⚠ External database unavailable (${errorType}): ${leadDatabase.name} - Falling back to mock data`);
    }
    
    // Throw a simplified error
    throw new Error(errorType);
  } finally {
    // Always close the connection
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        // Silently handle connection close errors
      }
    }
  }
};

/**
 * Test connection to external lead database
 * @param {Object} dbConfig - Database configuration
 * @returns {Promise<Object>} Connection test result
 */
const testLeadDatabaseConnection = async (dbConfig) => {
  let connection = null;
  
  try {
    connection = await createLeadDatabaseConnection(dbConfig);
    
    // Test query
    await connection.execute('SELECT 1');
    
    return {
      success: true,
      message: 'Database connection successful',
      details: `Connected to ${dbConfig.database} on ${dbConfig.host}:${dbConfig.port || 3306}`
    };
  } catch (error) {
    return {
      success: false,
      message: 'Database connection failed',
      error: error.message
    };
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error('Error closing test connection:', closeError);
      }
    }
  }
};

module.exports = {
  createLeadDatabaseConnection,
  fetchLeadsFromExternalDatabase,
  testLeadDatabaseConnection
};
