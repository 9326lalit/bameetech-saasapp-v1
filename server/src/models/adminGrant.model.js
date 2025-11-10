const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const AdminGrant = sequelize.define('AdminGrant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  planIds: {
    type: DataTypes.JSON,
    defaultValue: [],
    allowNull: false,
  },
  grantedBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'admin_grants',
  timestamps: true,
});

module.exports = AdminGrant;