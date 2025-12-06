/*
 * ملف نموذج الإعجاب (likeModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج الإعجاب (Like Model) باستخدام Sequelize ORM
 * - تمثيل جدول الإعجابات في قاعدة البيانات
 * - تحديد العلاقات مع المستخدمين والمنشورات
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Like = sequelize.define('Like', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل إعجاب
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
   * - الوصف: معرف المنشور الذي تم الإعجاب به
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
   * - الوصف: معرف المستخدم الذي قام بالإعجاب
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
   * - الوصف: تاريخ إنشاء الإعجاب
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
   * - الوصف: تاريخ آخر تحديث للإعجاب
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'likes',
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
module.exports = Like;