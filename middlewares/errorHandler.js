/**
 * ملف معالجة الأخطاء العام (errorHandler.js)
 * -------------------------------------------
 * هذا الملف يتعامل مع الأخطاء العامة (غير JWT)
 * معالج أخطاء JWT موجود في errorHandlerMiddleWares.js
 */

const { handleDatabaseError } = require('../utils/databaseErrorHandler');

/**
 * معالج الأخطاء العام
 * @param {Error} err - كائن الخطأ
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للخطوة التالية
 */
function errorHandler(err, req, res, next) {
  // طباعة تفاصيل الخطأ في الكونسول للتصحيح
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // تحديد رمز الحالة المناسب
  let statusCode = err.status || 500;
  
  // رسالة الخطأ المناسبة
  let message = err.message || "Internal Server Error";

  // معالجة أخطاء قاعدة البيانات تلقائياً (فقط إذا لم يحدد الكنترولر الحالة)
  if (!err.status) {
    const dbError = handleDatabaseError(err);
    if (dbError) {
      statusCode = dbError.statusCode;
      message = dbError.message;
    }
  }

  // إرجاع استجابة موحدة
  const response = {
    status: "failure",
    message: message
  };

  // إضافة تفاصيل أخطاء التحقق إذا وجدت
  if (err.errors && Array.isArray(err.errors)) {
    response.errors = err.errors;
  }

  // إضافة تفاصيل إضافية في بيئة التطوير
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err;
  }

  return res.status(statusCode).json(response);
}

module.exports = errorHandler; 