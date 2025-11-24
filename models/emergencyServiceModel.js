/*
 * ملف نموذج خدمة الطوارئ (emergencyServiceModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج خدمة الطوارئ (Emergency Service Model) باستخدام Sequelize ORM
 * - تمثيل جدول خدمات الطوارئ في قاعدة البيانات
 * - تحديد جميع حقول خدمة الطوارئ والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const EmergencyService = sequelize.define('EmergencyService', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل خدمة طوارئ
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  /*
   * الحقل: titleAr
   * -----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: العنوان بالعربية
   */
  titleAr: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: titleEn
   * -----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: العنوان بالإنجليزية
   */
  titleEn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: phoneNumber
   * -----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: رقم الهاتف
   */
  phoneNumber: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: image
   * ---------
   * - النوع: نص
   * - الوصف: رابط صورة الخدمة
   */
  image: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء الخدمة
   */
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  
  /*
   * الحقل: updatedAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ آخر تحديث للخدمة
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'emergency_services',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      fields: ['titleAr']
    },
    {
      fields: ['titleEn']
    },
    {
      fields: ['phoneNumber']
    }
  ]
});

// ==================== التصدير ====================
module.exports = EmergencyService;