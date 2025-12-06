/*
ملف نموذج المدينة (cityModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "المدينة" باستخدام Sequelize ORM
- يمثل جدول المدن في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمدن

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// تعريف نموذج المدينة باستخدام Sequelize
const City = sequelize.define('City', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },

  // اسم المدينة بالعربية
  name_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    unique: true                   // يجب أن يكون فريداً
  },

  // اسم المدينة بالإنجليزية
  name_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    unique: true                   // يجب أن يكون فريداً
  },

  // تاريخ الإنشاء
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW    // القيمة الافتراضية: الوقت الحالي
  },

  // تاريخ آخر تحديث
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  // اسم الجدول في قاعدة البيانات
  tableName: 'cities',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true,
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = City;