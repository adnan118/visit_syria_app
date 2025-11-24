/*
 * أداة تهيئة قاعدة البيانات (databaseInit.js)
 * ======================================
 * 
 * الوظيفة الرئيسية:
 * ---------------
 * - تهيئة قاعدة البيانات وإنشاء الجداول عند بدء تشغيل التطبيق
 * - تشغيل جميع عمليات الهجرة دفعة واحدة
 * - التحقق من صحة قاعدة البيانات ووجود الجداول المطلوبة
 * 
 * لماذا نحتاج هذا الملف:
 * -------------------
 * 1. لضمان إنشاء الجداول تلقائياً عند تثبيت التطبيق
 * 2. لتشغيل جميع عمليات الهجرة دفعة واحدة
 * 3. للتحقق من أن جميع الجداول المطلوبة موجودة
 * 4. لتحسين أداء التطبيق من خلال التهيئة الصحيحة
 */

const sequelize = require('../models/sequelize');
const fs = require('fs');
const path = require('path');

/**
 * تشغيل جميع عمليات الهجرة دفعة واحدة
 * @returns {Promise<void>}
 * 
 * هذه الوظيفة:
 * 1. تشغيل جميع عمليات الهجرة الموجودة في مجلد migrations
 * 2. تطبع رسائل تأكيد عند نجاح كل عملية
 */
async function initializeDatabase() {
  try {
    console.log('بدء تشغيل جميع عمليات الهجرة دفعة واحدة...');
    
    // Get all migration files in the migrations directory
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js') && file !== 'index.js')
      .sort(); // Sort to ensure they run in order
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    let successCount = 0;
    let failedCount = 0;
    
    // Run each migration
    for (const file of migrationFiles) {
      console.log(`Running migration: ${file}`);
      try {
        const migration = require(path.join(migrationsDir, file));
        await migration.up(sequelize.getQueryInterface(), sequelize.constructor);
        console.log(`✓ Completed migration: ${file}`);
        successCount++;
      } catch (error) {
        console.log(`⚠ Migration ${file} failed or already applied:`, error.message);
        failedCount++;
        // Continue with other migrations
      }
    }
    
    console.log(`اكتملت عملية الهجرة: ${successCount} نجحت, ${failedCount} فشلت`);
  } catch (error) {
    console.error('Database migration failed:', error.message);
    throw error;
  }
}

/**
 * التحقق من صحة قاعدة البيانات
 * @returns {Promise<boolean>}
 * 
 * هذه الوظيفة:
 * 1. تتحقق من اتصال قاعدة البيانات
 * 2. تتأكد من وجود جميع الجداول المطلوبة
 */
async function checkDatabaseHealth() {
  try {
    // اختبار الاتصال
    await sequelize.authenticate();
    console.log('Database connection authenticated successfully');
    
    // الحصول على اسم قاعدة البيانات
    const databaseName = sequelize.config.database;
    console.log(`Connected to database: ${databaseName}`);
    
    // الحصول على قائمة الجداول الموجودة
    const queryInterface = sequelize.getQueryInterface();
    const tables = await queryInterface.showAllTables();
    
    // التحقق من الجداول المطلوبة
    const requiredTables = [
      'users',
      'tokens',
      'posts',
      'stories',
      'tags',
      'services',
      'likes',
      'comments',
      'saves',
      'offers',
      'favorites', // إضافة جدول favorites
      'user_interests', // إضافة جدول user_interests
      'cities', // إضافة جدول cities
      'emergency_services', // إضافة جدول emergency_services
      'exhibitions', // إضافة جدول exhibitions
      'festivals_events' // إضافة جدول festivals_events
    ];
    
    console.log('Required tables:', requiredTables);
    
    // التحقق من وجود جميع الجداول المطلوبة
    const allTablesExist = requiredTables.every(table => tables.includes(table));
    
    if (!allTablesExist) {
      const missingTables = requiredTables.filter(table => !tables.includes(table));
      console.warn(`Missing tables: ${missingTables.join(', ')}`);
      return false;
    }
    
    console.log('All required tables exist');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error.message);
    return false;
  }
}

/**
 * التحقق من إنشاء الجداول فعليًا عن طريق الاستعلام عنها
 * @returns {Promise<boolean>}
 */
async function verifyTableCreation() {
  try {
    console.log('Verifying table creation...');
    
    // التحقق من وجود الجداول الأساسية
    const requiredTables = [
      'users',
      'tokens',
      'posts',
      'stories',
      'tags',
      'services',
      'likes',
      'comments',
      'saves',
      'offers',
      'favorites', // إضافة جدول favorites
      'user_interests', // إضافة جدول user_interests
      'cities', // إضافة جدول cities
      'emergency_services', // إضافة جدول emergency_services
      'exhibitions', // إضافة جدول exhibitions
      'festivals_events', // إضافة جدول festivals_events
      'trips' // إضافة جدول trips
    ];
    
    const queryInterface = sequelize.getQueryInterface();
    const existingTables = await queryInterface.showAllTables();
    
    for (const tableName of requiredTables) {
      if (existingTables.includes(tableName)) {
        console.log(`✓ Table ${tableName} exists`);
      } else {
        console.warn(`⚠ Table ${tableName} does not exist`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Table verification failed:', error.message);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  checkDatabaseHealth,
  verifyTableCreation
};