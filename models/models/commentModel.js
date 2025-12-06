/*
 * ملف نموذج التعليق (commentModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج التعليق (Comment Model) باستخدام Sequelize ORM
 * - تمثيل جدول التعليقات في قاعدة البيانات
 * - تحديد العلاقات مع المستخدمين والمنشورات
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Comment = sequelize.define('Comment', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل تعليق
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
   * - الوصف: معرف المنشور المرتبط بالتعليق
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
   * - الوصف: معرف المستخدم صاحب التعليق
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
   * الحقل: content
   * ------------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: محتوى التعليق
   */
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  /*
   * الحقل: parentId
   * -------------
   * - النوع: عدد صحيح
   * - الوصف: معرف التعليق الأب (للردود)
   */
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    }
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء التعليق
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
   * - الوصف: تاريخ آخر تحديث للتعليق
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'comments',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      fields: ['postId']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['parentId']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// ==================== التصدير ====================
module.exports = Comment;