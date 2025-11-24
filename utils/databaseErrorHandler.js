/*
معالج أخطاء قواعد البيانات (databaseErrorHandler.js)
---------------------------------------------------
- يتعامل مع أخطاء قواعد البيانات المختلفة (MongoDB, MySQL, PostgreSQL, SQLite)
- يحول أخطاء قاعدة البيانات إلى رسائل مفهومة للمستخدم
- يعمل تلقائياً مع أي نوع قاعدة بيانات
*/

/**
 * تحليل نوع قاعدة البيانات من الخطأ
 * @param {Error} error - كائن الخطأ
 * @returns {string} نوع قاعدة البيانات
 */
function detectDatabaseType(error) {
  // MongoDB (Mongoose/MongoServerError)
  if (
    error?.name === 'CastError' ||
    error?.name === 'ValidationError' ||
    error?.name === 'MongoError' ||
    error?.name === 'MongoServerError' ||
    error?.code === 11000 ||
    (typeof error?.message === 'string' && /E11000|duplicate key/i.test(error.message))
  ) {
    return 'mongodb';
  }

  // MySQL errors
  if (typeof error?.code === 'string' && error.code.startsWith('ER_')) {
    return 'mysql';
  }

  // PostgreSQL errors
  if (typeof error?.code === 'string' && (error.code.startsWith('23') || error.code === '23505')) {
    return 'postgresql';
  }

  // SQLite errors
  if (error?.code === 'SQLITE_CONSTRAINT' || error?.code === 'SQLITE_ERROR') {
    return 'sqlite';
  }

  // Default
  return 'unknown';
}

/**
 * معالجة أخطاء MongoDB
 * @param {Error} error - كائن الخطأ
 * @returns {Object} كائن الخطأ المعالج
 */
function handleMongoDBError(error) {
  let statusCode = 500;
  let message = "Database error";

  const name = error?.name;
  switch (name) {
    case 'CastError':
      if (error.kind === 'ObjectId') {
        statusCode = 400;
        message = "Invalid ID format";
      } else {
        statusCode = 400;
        message = "Invalid data format";
      }
      break;

    case 'ValidationError':
      statusCode = 400;
      message = "Validation failed";
      break;

    case 'MongoError':
    case 'MongoServerError':
      if (error.code === 11000 || /E11000|duplicate key/i.test(error.message || '')) {
        statusCode = 409;
        // Try to extract duplicate field for a clearer message
        const field = error.keyPattern ? Object.keys(error.keyPattern)[0] : (error.keyValue ? Object.keys(error.keyValue)[0] : null);
        if (field) {
          message = `${field} already exists`;
        } else {
          message = "Record already exists";
        }
      } else {
        statusCode = 500;
        message = "Database operation failed";
      }
      break;
  }

  return { statusCode, message };
}

/**
 * معالجة أخطاء MySQL
 * @param {Error} error - كائن الخطأ
 * @returns {Object} كائن الخطأ المعالج
 */
function handleMySQLError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case 'ER_NO_REFERENCED_ROW_2':
      statusCode = 400;
      message = "Cannot delete: referenced by other records";
      break;
      
    case 'ER_DUP_ENTRY':
      statusCode = 409;
      message = "Record already exists";
      break;
      
    case 'ER_NO_SUCH_TABLE':
      statusCode = 500;
      message = "Database table not found";
      break;
      
    case 'ER_BAD_FIELD_ERROR':
      statusCode = 400;
      message = "Invalid field name";
      break;
      
    case 'ER_DATA_TOO_LONG':
      statusCode = 400;
      message = "Data too long for field";
      break;
  }
  
  return { statusCode, message };
}

/**
 * معالجة أخطاء PostgreSQL
 * @param {Error} error - كائن الخطأ
 * @returns {Object} كائن الخطأ المعالج
 */
function handlePostgreSQLError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case '23505': // unique_violation
      statusCode = 409;
      message = "Record already exists";
      break;
      
    case '23503': // foreign_key_violation
      statusCode = 400;
      message = "Cannot delete: referenced by other records";
      break;
      
    case '42P01': // undefined_table
      statusCode = 500;
      message = "Database table not found";
      break;
      
    case '42703': // undefined_column
      statusCode = 400;
      message = "Invalid field name";
      break;
  }
  
  return { statusCode, message };
}

/**
 * معالجة أخطاء SQLite
 * @param {Error} error - كائن الخطأ
 * @returns {Object} كائن الخطأ المعالج
 */
function handleSQLiteError(error) {
  let statusCode = 500;
  let message = "Database error";
  
  switch (error.code) {
    case 'SQLITE_CONSTRAINT':
      statusCode = 400;
      message = "Constraint violation";
      break;
      
    case 'SQLITE_ERROR':
      statusCode = 500;
      message = "Database operation failed";
      break;
  }
  
  return { statusCode, message };
}

/**
 * معالج أخطاء قاعدة البيانات الموحد
 * @param {Error} error - كائن الخطأ
 * @returns {Object} كائن الخطأ المعالج
 */
function handleDatabaseError(error) {
  const dbType = detectDatabaseType(error);
  
  switch (dbType) {
    case 'mongodb':
      return handleMongoDBError(error);
      
    case 'mysql':
      return handleMySQLError(error);
      
    case 'postgresql':
      return handlePostgreSQLError(error);
      
    case 'sqlite':
      return handleSQLiteError(error);
      
    default:
      return {
        statusCode: 500,
        message: "Database error occurred"
      };
  }
}

module.exports = {
  handleDatabaseError,
  detectDatabaseType
}; 