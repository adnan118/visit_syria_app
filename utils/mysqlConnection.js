const mysql = require("mysql2/promise");
const config = require("../config");

// Debug: Log the database configuration values
console.log('MySQL Connection Configuration:');
console.log('- Host:', config.DB_HOST);
console.log('- User:', config.DB_USER);
console.log('- Password:', config.DB_PASSWORD === '' ? '(empty string)' : config.DB_PASSWORD);
console.log('- Database:', config.DB_NAME);
console.log('- Port:', config.DB_PORT);

const dbConfig = {
  host: config.DB_HOST,
  user: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  port: config.DB_PORT,
  // Valid MySQL2 configuration options
  connectionLimit: 10,
  charset: 'utf8mb4',
  connectTimeout: 30000, // 30 seconds
  // Removed invalid options that cause warnings:
  // acquireTimeout, timeout, reconnect, reconnectDelay, maxReconnectAttempts
  // These are not valid mysql2 connection options
};

async function getConnection(retryCount = 0) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log("Connected to MySQL database successfully!");
    return connection;
  } catch (error) {
    console.error("Failed to connect to MySQL database:", error.message);
    
    // Simple retry mechanism (removed complex retry logic that used invalid options)
    if (retryCount < 3) {
      console.log(`Retrying connection... Attempt ${retryCount + 1}/3`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return getConnection(retryCount + 1);
    }
    
    throw error;
  }
}

module.exports = { getConnection };