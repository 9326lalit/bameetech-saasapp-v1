const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
  },
  email: {
    type: DataTypes.STRING,
  },
  phone: {
    type: DataTypes.STRING,
  },
  company: {
    type: DataTypes.STRING,
  },
  status: {
    type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'closed'),
    defaultValue: 'new',
  },
  source: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.TEXT,
  },
   createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  timestamps: true,
});

module.exports = Lead;
