const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db.config');

const Lead = sequelize.define('Lead', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  //table name
  //leaddatabase id
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
});

//connectivity

module.exports = Lead;