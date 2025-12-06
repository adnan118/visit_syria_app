/*
ملف نموذج المرشد السياحي (tourGuideModel.js)
------------------------------------------
وظيفة الملف:
- يحدد نموذج "المرشد السياحي" باستخدام Sequelize ORM
- يمثل جدول المرشدين السياحيين في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمرشد السياحي

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// استيراد نموذج المدينة
const City = require('./cityModel');

// تعريف نموذج المرشد السياحي باستخدام Sequelize
const TourGuide = sequelize.define('TourGuide', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },

  // اسم المرشد
  name: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    validate: {
      len: [2, 100]                // يجب أن يكون الاسم بين 2 و 100 حرف
    }
  },

  // صورة المرشد
  image: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true                // حقل اختياري
  },

  // معرف المدينة (مفتاح خارجي)
  cityId: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    allowNull: false,              // حقل مطلوب
    references: {
      model: City,                 // مرجع لنموذج المدينة
      key: 'id'                    // مرجع لعمود المعرف
    }
  },

  // رقم الهاتف
  phone: {
    type: DataTypes.STRING,         // نوع الحقل: نص قريد
    allowNull: false,              // حقل مطلوب
    validate: {
      is: /^[0-9+\-\s()]+$/i      // التحقق من صيغة رقم الهاتف
    }
  },

  // مواقع التواصل الاجتماعي
  socialMedia: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: true,                // حقل اختياري
    defaultValue: {}               // القيمة الافتراضية: كائن فارغ
  },

  // السيرة الذاتية للمرشد
  bio: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: true                // حقل اختياري
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
  tableName: 'tour_guides',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true
});

// تعريف العلاقة بين المرشدين السياحيين والمدن
TourGuide.belongsTo(City, {
  foreignKey: 'cityId',
  as: 'city'
});

City.hasMany(TourGuide, {
  foreignKey: 'cityId',
  as: 'tourGuides'
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = TourGuide;