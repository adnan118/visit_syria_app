/*
ملف نموذج الفنون والثقافة (artsCultureModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "الفنون والثقافة" باستخدام Sequelize ORM
- يمثل جدول الفنون والثقافة في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للفنون والثقافة

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// تعريف نموذج الفنون والثقافة باستخدام Sequelize
const ArtsCulture = sequelize.define('ArtsCulture', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true,           // يزيد تلقائياً
    field: 'id'                    // اسم العمود في قاعدة البيانات
  },

  // الاسم بالعربية
  name_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    field: 'name_ar'              // اسم العمود في قاعدة البيانات
  },

  // الاسم بالإنجليزية
  name_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    field: 'name_en'              // اسم العمود في قاعدة البيانات
  },

  // الوصف بالعربية
  description_ar: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false,              // حقل مطلوب
    field: 'description_ar'       // اسم العمود في قاعدة البيانات
  },

  // الوصف بالإنجليزية
  description_en: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false,              // حقل مطلوب
    field: 'description_en'       // اسم العمود في قاعدة البيانات
  },

  // صورة (رابط الصورة)
  image: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'image'                // اسم العمود في قاعدة البيانات
  },

  // نقطة الطول (Latitude)
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // نوع الحقل: عدد عشري
    allowNull: true,               // حقل اختياري
    field: 'latitude'             // اسم العمود في قاعدة البيانات
  },

  // نقطة العرض (Longitude)
  longitude: {
    type: DataTypes.DECIMAL(11, 8), // نوع الحقل: عدد عشري
    allowNull: true,               // حقل اختياري
    field: 'longitude'            // اسم العمود في قاعدة البيانات
  },

  // تاريخ الإنشاء
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,   // القيمة الافتراضية: الوقت الحالي
    field: 'created_at'           // اسم العمود في قاعدة البيانات
  },

  // تاريخ آخر تحديث
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'           // اسم العمود في قاعدة البيانات
  }

}, {
  // اسم الجدول في قاعدة البيانات
  tableName: 'arts_culture',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = ArtsCulture;
