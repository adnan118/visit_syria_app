const { Sequelize } = require('sequelize');
const config = require('../config');

// Debug: Log the database configuration values
console.log('Database Configuration:');
console.log('- Host:', config.DB_HOST);
console.log('- User:', config.DB_USER);
console.log('- Password:', config.DB_PASSWORD === '' ? '(empty string)' : config.DB_PASSWORD);
console.log('- Database:', config.DB_NAME);
console.log('- Port:', config.DB_PORT);

// إنشاء اتصال بقاعدة البيانات
const sequelize = new Sequelize(
  config.DB_NAME,
  config.DB_USER,
  config.DB_PASSWORD,
  {
    host: config.DB_HOST,
    port: config.DB_PORT,
    dialect: 'mysql',
    logging: false, // قم بتعيين true إذا كنت تريد رؤية استعلامات SQL في الكونسول
    dialectOptions: {
      connectTimeout: 60000
    },
    pool: {
      max: 10,
      min: 0,
      acquire: 60000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
