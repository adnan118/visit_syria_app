/*
 * ملف نموذج القصة (storyModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج القصة (Story Model) باستخدام Sequelize ORM
 * - تمثيل جدول القصص في قاعدة البيانات
 * - تحديد جميع حقول القصة والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Story = sequelize.define('Story', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل قصة
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
   * - الوصف: معرف المستخدم صاحب القصة
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
   * الحقل: caption
   * ------------
   * - النوع: نص
   * - الوصف: وصف القصة
   */
  caption: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: location
   * -------------
   * - النوع: نص
   * - الوصف: موقع القصة
   */
  location: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: media
   * ----------
   * - النوع: نص
   * - الوصف: الوسائط المرفقة بالقصة (صور/فيديو)
   */
  media: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: tags
   * ----------
   * - النوع: نص
   * - الوصف: معرفات الوسوم المرتبطة بالقصة بصيغة JSON
   */
  tags: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('tags');
      if (rawValue === null || rawValue === undefined) {
        return [];
      }
      try {
        return typeof rawValue === 'string' ? JSON.parse(rawValue) : rawValue;
      } catch (e) {
        return [];
      }
    },
    set(value) {
      this.setDataValue('tags', Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([]));
    }
  },
  
  /*
   * الحقل: expiresAt
   * --------------
   * - النوع: تاريخ ووقت
   * - الخاصية: إجباري
   * - الوصف: تاريخ انتهاء صلاحية القصة
   */
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  
  /*
   * الحقل: views
   * ----------
   * - النوع: JSON
   * - الوصف: المشاهدين
   */
  views: {
    type: DataTypes.JSON
  },
  
  /*
   * الحقل: viewCount
   * ---------------
   * - النوع: عدد صحيح
   * - القيمة الافتراضية: 0
   * - الوصف: عدد المشاهدات
   */
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء القصة
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
   * - الوصف: تاريخ آخر تحديث للقصة
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'stories',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['expiresAt']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// ==================== التصدير ====================
module.exports = Story;