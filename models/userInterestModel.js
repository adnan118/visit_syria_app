/*
 * ملف نموذج اهتمامات المستخدم (userInterestModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج اهتمامات المستخدم (User Interest Model) باستخدام Sequelize ORM
 * - تمثيل جدول الوسائط بين المستخدمين والوسوم
 * - تحديد العلاقات بين المستخدمين والوسوم
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const UserInterest = sequelize.define('UserInterest', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل اهتمام
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
   * - الوصف: معرف المستخدم
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
   * الحقل: tagId
   * ----------
   * - النوع: عدد صحيح
   * - الخاصية: مفتاح خارجي يربط بجدول الوسوم
   * - الوصف: معرف الوسم
   */
  tagId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tags',
      key: 'id'
    }
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء الاهتمام
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
   * - الوصف: تاريخ آخر تحديث لل interesse
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'user_interests',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['userId', 'tagId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['tagId']
    }
  ]
});

// ==================== التصدير ====================
module.exports = UserInterest;