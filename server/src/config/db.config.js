// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// // Modified for SQLite testing
// const sequelize = new Sequelize({
//   dialect: process.env.DB_DIALECT || 'sqlite',
//   storage: process.env.DB_STORAGE || './database.sqlite',
//   logging: false,
// });

// const testConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('Database connection has been established successfully.');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// };

// module.exports = { sequelize, testConnection };

const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
    logging: false,
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true',
    },
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL:', error.message);
  }
};

module.exports = { sequelize, testConnection };
