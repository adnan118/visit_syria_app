/*
 * ملف نموذج الوسم (tagModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج الوسم (Tag Model) باستخدام Sequelize ORM
 * - تمثيل جدول الوسوم في قاعدة البيانات
 * - تحديد جميع حقول الوسم والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Tag = sequelize.define('Tag', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل وسم
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
   * - الوصف: اسم الوسم بالعربية
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
   * - الوصف: اسم الوسم بالإنجليزية
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
   * - الوصف: اسم URL_FRIENDLY للوسم
   */
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء الوسم
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
   * - الوصف: تاريخ آخر تحديث للوسم
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tags',
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
module.exports = Tag;

// ==================== الدوال المساعدة ====================
// دالة لإنشاء slug من النص
Tag.generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // استبدال المسافات بشرطة
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, '') // السماح بالأحرف اللاتينية والعربية والأرقام والشرطات
    .replace(/-+/g, '-') // استبدال تسلسل الشرطات بشرطة واحدة
    .replace(/^-|-$/g, ''); // إزالة الشرطات من البداية والنهاية
};

// Hook لتحديث slug تلقائيًا قبل الحفظ
Tag.addHook('beforeSave', async (tag) => {
  // تحديث slug إذا تم تعديل nameAr أو nameEn
  if (tag.changed('nameAr') || tag.changed('nameEn')) {
    // استخدام nameEn كأساس للـ slug إذا كان متوفرًا، وإلا استخدام nameAr
    const baseText = tag.nameEn || tag.nameAr || '';
    if (baseText) {
      tag.slug = Tag.generateSlug(baseText);
    }
  }
});
