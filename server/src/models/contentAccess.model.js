const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const ContentAccess = sequelize.define('ContentAccess', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  planId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  contentId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  accessToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  lastAccessedAt: {
    type: DataTypes.DATE,
  },
  accessCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  ipAddress: {
    type: DataTypes.STRING,
  },
  userAgent: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'content_access',
  indexes: [
    {
      unique: true,
      fields: ['accessToken']
    },
    {
      fields: ['userId', 'planId']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

module.exports = ContentAccess;
