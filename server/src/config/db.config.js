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
//     // console.log('Database connection has been established successfully.');
//   } catch (error) {
//     console.error('Unable to connect to the database:', error);
//   }
// };

// module.exports = { sequelize, testConnection };



const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,     // database name
  process.env.DB_USER,     // username
  process.env.DB_PASSWORD, // password
  {
    host: process.env.DB_HOST,  
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false,
    dialectOptions: process.env.DB_SSL === 'true' ? {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    } : {},
  }
);

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully!');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
};

module.exports = { sequelize, testConnection };
