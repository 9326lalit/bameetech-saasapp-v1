const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Plan = sequelize.define('Plan', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  duration: {
    type: DataTypes.INTEGER, // in days
    allowNull: false,
  },
  features: {
    type: DataTypes.TEXT,
  },
  // Lead database association (legacy)
  leadDatabaseId: {
    type: DataTypes.INTEGER,
    references: {
      model: 'lead_databases',
      key: 'id'
    }
  },
  // Lead tables (Supabase/Elementor forms) - array of table names
  leadTables: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // Field configuration for each table - which fields to show to subscribers
  leadTableFields: {
    type: DataTypes.JSON,
    defaultValue: {} // Format: { "table_name": ["field1", "field2", ...] }
  },
  // Lead limits
  leadLimit: {
    type: DataTypes.INTEGER,
    defaultValue: null, // null means unlimited
  },
  // HTML content for iframe
  htmlContent: {
    type: DataTypes.TEXT,
  },
  // Document uploads (store file paths)
  documents: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  // WordPress protected content URLs
  contentUrls: {
    type: DataTypes.JSON,
    defaultValue: [],
    // Structure: [
    //   {
    //     id: "unique-id",
    //     title: "Module 1: Introduction",
    //     url: "https://yourwordpress.com/module-1",
    //     password: "wp_password_here",
    //     description: "Learn the basics",
    //     order: 1
    //   }
    // ]
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

module.exports = Plan;