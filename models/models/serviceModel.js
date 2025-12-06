/*
 * ملف نموذج الخدمة (serviceModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج الخدمة (Service Model) باستخدام Sequelize ORM
 * - تمثيل جدول الخدمات في قاعدة البيانات
 * - تحديد جميع حقول الخدمة والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Service = sequelize.define('Service', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل خدمة
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  /*
   * الحقل: nameAr
   * -----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: اسم الخدمة بالعربية
   */
  nameAr: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: nameEn
   * -----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: اسم الخدمة بالإنجليزية
   */
  nameEn: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: slug
   * ----------
   * - النوع: نص
   * - الخاصية: إجباري + فريد
   * - الوصف: اسم URL_FRIENDLY للخدمة
   */
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  /*
   * الحقل: icon
   * ---------
   * - النوع: نص
   * - الوصف: رابط أيقونة الخدمة
   */
  icon: {
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
  tableName: 'services',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['nameAr']
    },
    {
      fields: ['nameEn']
    }
  ]
});

// ==================== التصدير ====================
module.exports = Service;

// ==================== الدوال المساعدة ====================
// دالة لإنشاء slug من النص
Service.generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // استبدال المسافات بشرطة
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, '') // السماح بالأحرف اللاتينية والعربية والأرقام والشرطات
    .replace(/-+/g, '-') // استبدال تسلسل الشرطات بشرطة واحدة
    .replace(/^-|-$/g, ''); // إزالة الشرطات من البداية والنهاية
};

// Hook لتحديث slug تلقائيًا قبل الحفظ
Service.addHook('beforeSave', async (service) => {
  // تحديث slug إذا تم تعديل nameAr أو nameEn
  if (service.changed('nameAr') || service.changed('nameEn')) {
    // استخدام nameEn كأساس للـ slug إذا كان متوفرًا، وإلا استخدام nameAr
    const baseText = service.nameEn || service.nameAr || '';
    if (baseText) {
      service.slug = Service.generateSlug(baseText);
    }
  }
});
