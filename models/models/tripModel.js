/*
 * ملف نموذج الرحلات (tripModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج الرحلات (Trip Model) باستخدام Sequelize ORM
 * - تمثيل جدول الرحلات في قاعدة البيانات
 * - تحديد العلاقات مع المستخدمين والمعارض والمهرجانات
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Trip = sequelize.define('Trip', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل سجل رحلة
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  /*
   * الحقل: userId
   * -----------
   * - النوع: عدد صحيح
   * - الخاصية: مفتاح خارجي يربط بجدول المستخدمين
   * - الوصف: معرف المستخدم صاحب الرحلة
   */
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  /*
   * الحقل: name
   * ----------
   * - النوع: نص
   * - الوصف: اسم الرحلة
   */
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: itemType
   * --------------
   * - النوع: قيمة من مجموعة محددة (Exhibitions أو FestivalsEvents)
   * - الوصف: نوع العنصر في الرحلة
   */
  itemType: {
    type: DataTypes.ENUM('Exhibitions', 'FestivalsEvents'),
    allowNull: false
  },
  
  /*
   * الحقل: itemId
   * -----------
   * - النوع: عدد صحيح
   * - الوصف: معرف العنصر في الرحلة (معرف المعرض أو الفعالية)
   */
  itemId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء الرحلة
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
   * - الوصف: تاريخ آخر تحديث للرحلة
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'trips',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['userId', 'name', 'itemType', 'itemId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['name']
    },
    {
      fields: ['itemType', 'itemId']
    }
  ],
  // إضافة getter methods للحقول
  getterMethods: {
    // Getter method للحصول على تسمية نوع العنصر باللغتين العربية والإنجليزية
    itemTypeName() {
      const itemTypes = {
        'Exhibitions': { ar: 'المعارض', en: 'Exhibitions' },
        'FestivalsEvents': { ar: 'المهرجانات والأحداث', en: 'Festivals & Events' }
      };
      
      return itemTypes[this.itemType] || { ar: 'غير محدد', en: 'Unknown' };
    }
  }
});

// ==================== التصدير ====================
module.exports = Trip;