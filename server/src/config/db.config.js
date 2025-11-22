// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize(
//   process.env.DB_NAME,     // database name
//   process.env.DB_USER,     // username
//   process.env.DB_PASSWORD, // password
//   {
//     host: process.env.DB_HOST,  
//     dialect: process.env.DB_DIALECT || 'mysql',
//     logging: false,
//     dialectOptions: process.env.DB_SSL === 'true' ? {
//       ssl: {
//         require: true,
//         rejectUnauthorized: false,
//       },
//     } : {},
//   }
// );

// const testConnection = async () => {
//   try {
//     await sequelize.authenticate();
//     console.log('✅ Database connected successfully!');
//   } catch (error) {
//     console.error('❌ Unable to connect to the database:', error);
//   }
// };

// module.exports = { sequelize, testConnection };


const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,        // bameetechdb
  process.env.DB_USER,        // bameeuser
  process.env.DB_PASSWORD,    // StrongPassword123@
  {
    host: process.env.DB_HOST,  
    port: process.env.DB_PORT || 5432,
    dialect: process.env.DB_DIALECT || 'postgres',
    logging: false,

    dialectOptions: process.env.DB_SSL === 'true'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
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
