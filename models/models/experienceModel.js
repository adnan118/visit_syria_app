/*
ملف نموذج التجارب (experienceModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "التجارب" باستخدام Sequelize ORM
- يمثل جدول التجارب في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للتجارب

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// استيراد نموذج المرشد السياحي
const TourGuide = require('./tourGuideModel');

// تعريف نموذج التجربة باستخدام Sequelize
const Experience = sequelize.define('Experience', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },

  // معرف المرشد السياحي (مفتاح خارجي)
  tourGuideId: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    allowNull: false,              // حقل مطلوب
    references: {
      model: TourGuide,            // مرجع لنموذج المرشد السياحي
      key: 'id'                    // مرجع لعمود المعرف
    }
  },

  // وصف التجربة
  description: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false               // حقل مطلوب
  },

  // الصور (كصفيف من الروابط)
  images: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: true,                // حقل اختياري
    defaultValue: []               // القيمة الافتراضية: مصفوفة فارغة
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
  tableName: 'experiences',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true
});

// تعريف العلاقة بين التجارب والمرشدين السياحيين
Experience.belongsTo(TourGuide, {
  foreignKey: 'tourGuideId',
  as: 'tourGuide',
  onDelete: 'CASCADE',    
  hooks: true            // <-- ضروري لتفعيل الحذف التلقائي من داخل Sequelize
});

TourGuide.hasMany(Experience, {
  foreignKey: 'tourGuideId',
  as: 'experiences',
  onDelete: 'CASCADE',    
  hooks: true            // لتفعيل العملية داخل الكود وليس فقط في قاعدة البيانات
});


// تصدير النموذج للاستخدام في بقية المشروع
module.exports = Experience;