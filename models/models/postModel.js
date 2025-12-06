/*
 * ملف نموذج المنشور (postModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج المنشور (Post Model) باستخدام Sequelize ORM
 * - تمثيل جدول المنشورات في قاعدة البيانات
 * - تحديد جميع حقول المنشور والتحقق من صحتها
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const Post = sequelize.define('Post', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل منشور
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
   * - الوصف: معرف المستخدم صاحب المنشور
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
   * الحقل: title
   * ----------
   * - النوع: نص
   * - الخاصية: إجباري
   * - الوصف: عنوان المنشور
   */
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  
  /*
   * الحقل: content
   * ------------
   * - النوع: نص
   * - الوصف: محتوى المنشور
   */
  content: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: media
   * ----------
   * - النوع: نص
   * - الوصف: الوسائط المرفقة بالمنشور (صور/فيديو) بصيغة JSON
   */
  media: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: tags
   * ----------
   * - النوع: نص
   * - الوصف: معرفات الوسوم المرتبطة بالمنشور بصيغة JSON
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
   * الحقل: services
   * --------------
   * - النوع: نص
   * - الوصف: معرفات الخدمات المرتبطة بالمنشور بصيغة JSON
   */
  services: {
    type: DataTypes.TEXT,
    defaultValue: '[]',
    get() {
      const rawValue = this.getDataValue('services');
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
      this.setDataValue('services', Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([]));
    }
  },
  
  /*
   * الحقل: likesCount
   * ---------------
   * - النوع: عدد صحيح
   * - القيمة الافتراضية: 0
   * - الوصف: عدد الإعجابات على المنشور
   */
  likesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  /*
   * الحقل: commentsCount
   * ------------------
   * - النوع: عدد صحيح
   * - القيمة الافتراضية: 0
   * - الوصف: عدد التعليقات على المنشور
   */
  commentsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  /*
   * الحقل: sharesCount
   * ----------------
   * - النوع: عدد صحيح
   * - القيمة الافتراضية: 0
   * - الوصف: عدد مرات مشاركة المنشور
   */
  sharesCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  /*
   * الحقل: viewsCount
   * ---------------
   * - النوع: عدد صحيح
   * - القيمة الافتراضية: 0
   * - الوصف: عدد مشاهدات المنشور
   */
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  /*
   * الحقل: isDeleted
   * --------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: false
   * - الوصف: هل المنشور محذوف؟
   */
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  /*
   * الحقل: status
   * ------------
   * - النوع: قيمة من مجموعة محددة
   * - القيمة الافتراضية: pending
   * - الوصف: حالة المنشور (قيد الانتظار/موافق عليه/مرفوض)
   */
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    defaultValue: 'pending'
  },
  
  /*
   * الحقل: rejectionReason
   * --------------------
   * - النوع: نص
   * - الوصف: سبب رفض المنشور
   */
  rejectionReason: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء المنشور
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
   * - الوصف: تاريخ آخر تحديث للمنشور
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'posts',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['status']
    },
    {
      fields: ['likesCount']
    },
    {
      fields: ['commentsCount']
    },
    {
      fields: ['sharesCount']
    },
    {
      fields: ['viewsCount']
    }
  ],
  getterMethods: {
    /*
     * دالة للحصول على ترجمة الحالة إلى العربية
     */
    status_ar: function() {
      const translations = {
        "pending": "قيد الانتظار",
        "approved": "موافق عليه",
        "rejected": "مرفوض"
      };
      return translations[this.status] || this.status;
    }
  }
});

// ==================== التصدير ====================
module.exports = Post;




