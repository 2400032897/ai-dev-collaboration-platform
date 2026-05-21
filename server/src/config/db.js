const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// Use SQLite for development, MySQL for production
if (process.env.DB_DIALECT === 'sqlite' || process.env.NODE_ENV === 'development') {
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../devcollab.db'),
    logging: false,
  });
  console.log('Using SQLite database for development');
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASS,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql',
      logging: false,
      dialectOptions: process.env.DB_SSL === 'true' || (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com')) ? {
        ssl: {
          rejectUnauthorized: false
        }
      } : {},
      pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    }
  );
}

module.exports = sequelize;
