const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const LeadDatabase = sequelize.define('LeadDatabase', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  // Database connection details
  host: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  port: {
    type: DataTypes.INTEGER,
    defaultValue: 3306,
  },
  database: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  tableName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Field mappings for the lead table
  fieldMappings: {
    type: DataTypes.JSON,
    defaultValue: {
      name: 'name',
      email: 'email',
      mobile: 'mobile',
      website: 'website',
      business: 'business'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'lead_databases'
});

module.exports = LeadDatabase;
