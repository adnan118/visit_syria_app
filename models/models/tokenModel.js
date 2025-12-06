/*
 * ملف نموذج التوكن (tokenModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج التوكن (Token Model) باستخدام Sequelize ORM
 * - تمثيل جدول التوكنات في قاعدة البيانات
 * - تحديد جميع حقول التوكن والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Token = sequelize.define('Token', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل توكن
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
   * - الوصف: معرف المستخدم صاحب التوكن
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
   * الحقل: firstName
   * ---------------
   * - النوع: نص
   * - الوصف: الاسم الأول للمستخدم (نسخة احتياطية)
   */
  firstName: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: email
   * -----------
   * - النوع: نص
   * - الوصف: البريد الإلكتروني للمستخدم (نسخة احتياطية)
   */
  email: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: mobile
   * -----------
   * - النوع: نص
   * - الوصف: رقم الهاتف للمستخدم (نسخة احتياطية)
   */
  mobile: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: isAdmin
   * -------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: false
   * - الوصف: هل المستخدم مدير؟ (نسخة احتياطية)
   */
  isAdmin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  /*
   * الحقل: isActive
   * --------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: true
   * - الوصف: هل المستخدم مفعل؟ (نسخة احتياطية)
   */
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  /*
   * الحقل: refreshToken
   * -----------------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: التوكن لتحديث الوصول
   */
  refreshToken: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  
  /*
   * الحقل: accessToken
   * ----------------
   * - النوع: نص
   * - الوصف: التوكن للوصول
   */
  accessToken: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء التوكن
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
   * - الوصف: تاريخ آخر تحديث للتوكن
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'tokens',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['accessToken']
    }
  ]
});

// ==================== التصدير ====================
module.exports = Token;