/*
ملف الإعدادات العامة (config.js)
-------------------------------
وظيفة الملف:
- يحتوي على جميع متغيرات البيئة والثوابت المركزية للمشروع
- يوفر إعدادات قابلة للتخصيص للتطبيق
- يسمح بتغيير الإعدادات دون تعديل الكود

مكتبات المستخدم:
- dotenv/config: لتحميل متغيرات البيئة من ملف .env تلقائيًا
*/

// تحميل متغيرات البيئة من ملف .env تلقائيًا
// يسمح باستخدام المتغيرات المعرفة في ملف .env
require("dotenv/config");

// Helper function to handle empty password correctly
const getDbPassword = () => {
  const password = process.env.DB_PASSWORD;
  // If password is explicitly set to empty string or undefined, return empty string
  return password === undefined || password === "undefined" ? "" : password;
};

// تصدير كائن يحتوي على جميع إعدادات المشروع
module.exports = {
  // رابط الـ API الأساسي (مثلاً: /api/v1)
  // إذا لم يكن موجوداً في المتغيرات البيئية، يستخدم القيمة الافتراضية
  API: process.env.API_URL || "/api/v1",
  
  // اسم المضيف الذي سيعمل عليه السيرفر
  // إذا لم يكن موجوداً في المتغيرات البيئية، يستخدم localhost
  HOST: process.env.HOST || "localhost",
  
  // رقم المنفذ الذي سيستمع عليه السيرفر
  // إذا لم يكن موجوداً في المتغيرات البيئية، يستخدم 3000
  PORT: process.env.PORT || 3003,
  
  // MySQL Database Configuration
  // عنوان مضيف قاعدة البيانات
  DB_HOST: process.env.DB_HOST || "localhost",
  
  // اسم المستخدم لقاعدة البيانات
  DB_USER: process.env.DB_USER || "root",
  
  // كلمة مرور قاعدة البيانات
  DB_PASSWORD: process.env.DB_PASSWORD || "",
  
  // اسم قاعدة البيانات
  DB_NAME: process.env.DB_NAME || "vs_app_db",
  
  // منفذ قاعدة البيانات
  DB_PORT: process.env.DB_PORT || 3306,

  // سر تشفير accessToken
  // يُستخدم لتشفير وفك تشفير توكنات الوصول
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || "vistsyriav11234",
  
  // سر تشفير refreshToken
  // يُستخدم لتشفير وفك تشفير توكنات التجديد
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || "vist3syria2v1",
  
  // تجاوز المصادقة في بيئة التطوير
  // يسمح بتجاوز التحقق من OAuth أثناء التطوير
  OAUTH_DEV_BYPASS: process.env.OAUTH_DEV_BYPASS || false,
  
  // عنوان الواجهة الأمامية
  // يُستخدم في إرسال البريد الإلكتروني والروابط
  FRONTEND_URL: process.env.FRONTEND_URL || "https://visitsyria.fun",
  
  // Email configuration for nodemailer (set these in your .env file for email functionality)
  EMAIL: process.env.EMAIL || "vistsyria@gmail.com",
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || "ruqvxelvigdqqwkq",

  // Media
  MEDIA_BASE_URL: process.env.MEDIA_BASE_URL || "https://visitsyria.fun",

  // Firebase Configuration
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "visit-syria-c5bcf",
  FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
  FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID,
};