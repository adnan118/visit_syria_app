/*
 * ملف نموذج الحفظ (saveModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج الحفظ (Save Model) باستخدام Sequelize ORM
 * - تمثيل جدول عمليات الحفظ في قاعدة البيانات
 * - تحديد العلاقات مع المستخدمين والمنشورات
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Save = sequelize.define('Save', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل عملية حفظ
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  /*
   * الحقل: postId
   * ----------
   * - النوع: عدد صحيح
   * - الخاصية: مفتاح خارجي يربط بجدول المنشورات
   * - الوصف: معرف المنشور الذي تم حفظه
   */
  postId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'posts',
      key: 'id'
    }
  },
  
  /*
   * الحقل: userId
   * -----------
   * - النوع: عدد صحيح
   * - الخاصية: مفتاح خارجي يربط بجدول المستخدمين
   * - الوصف: معرف المستخدم الذي قام بالحفظ
   */
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء عملية الحفظ
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
   * - الوصف: تاريخ آخر تحديث لعملية الحفظ
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'saves',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['postId', 'userId']
    },
    {
      fields: ['postId']
    },
    {
      fields: ['userId']
    }
  ]
});

// ==================== التصدير ====================
module.exports = Save;