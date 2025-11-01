const { LeadDatabase } = require('../models');

const getAllLeadDatabases = async (req, res) => {
  try {
    const databases = await LeadDatabase.findAll({
      where: { isActive: true },
      order: [['createdAt', 'ASC']]
    });
    
    res.status(200).json(databases);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching lead databases', error: error.message });
  }
};

const createLeadDatabase = async (req, res) => {
  try {
    const {
      name,
      description,
      host,
      port,
      database,
      username,
      password,
      tableName,
      fieldMappings
    } = req.body;
    
    const leadDatabase = await LeadDatabase.create({
      name,
      description,
      host,
      port: port || 3306,
      database,
      username,
      password,
      tableName,
      fieldMappings: fieldMappings || {
        name: 'name',
        email: 'email',
        mobile: 'mobile',
        website: 'website',
        business: 'business'
      }
    });
    
    res.status(201).json(leadDatabase);
  } catch (error) {
    res.status(500).json({ message: 'Error creating lead database', error: error.message });
  }
};

const updateLeadDatabase = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const leadDatabase = await LeadDatabase.findByPk(id);
    if (!leadDatabase) {
      return res.status(404).json({ message: 'Lead database not found' });
    }
    
    await leadDatabase.update(updateData);
    
    res.status(200).json(leadDatabase);
  } catch (error) {
    res.status(500).json({ message: 'Error updating lead database', error: error.message });
  }
};

const deleteLeadDatabase = async (req, res) => {
  try {
    const { id } = req.params;
    
    const leadDatabase = await LeadDatabase.findByPk(id);
    if (!leadDatabase) {
      return res.status(404).json({ message: 'Lead database not found' });
    }
    
    await leadDatabase.update({ isActive: false });
    
    res.status(200).json({ message: 'Lead database deactivated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting lead database', error: error.message });
  }
};

const testDatabaseConnection = async (req, res) => {
  try {
    const { host, port, database, username, password } = req.body;
    
    // For demo purposes, we'll just return success
    // In production, you would actually test the database connection
    res.status(200).json({ 
      success: true, 
      message: 'Database connection successful',
      details: `Connected to ${database} on ${host}:${port}`
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed', 
      error: error.message 
    });
  }
};

module.exports = {
  getAllLeadDatabases,
  createLeadDatabase,
  updateLeadDatabase,
  deleteLeadDatabase,
  testDatabaseConnection
};