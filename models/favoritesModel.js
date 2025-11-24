/*
 * ملف نموذج المفضلات (favoritesModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج المفضلات (Favorites Model) باستخدام Sequelize ORM
 * - تمثيل جدول المفضلات في قاعدة البيانات
 * - تحديد العلاقات مع المستخدمين والمعارض والمهرجانات
 */

// ==================== الاستيراد ====================
const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== استيراد النماذج ====================
const User = require('./userModel');
const Exhibitions = require('./exhibitionsModel');
const FestivalsEvents = require('./festivalsEventsModel');

// ==================== تعريف النموذج ====================
const Favorites = sequelize.define('Favorites', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل سجل مفضل
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
   * - الوصف: معرف المستخدم صاحب المفضلة
   */
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    }
  },
  
  /*
   * الحقل: itemType
   * --------------
   * - النوع: قيمة من مجموعة محددة (Exhibitions أو FestivalsEvents)
   * - الوصف: نوع العنصر المفضل
   */
  itemType: {
    type: DataTypes.ENUM('Exhibitions', 'FestivalsEvents'),
    allowNull: false
  },
  
  /*
   * الحقل: itemId
   * -----------
   * - النوع: عدد صحيح
   * - الوصف: معرف العنصر المفضل (معرف المعرض أو الفعالية)
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
   * - الوصف: تاريخ إضافة العنصر إلى المفضلة
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
   * - الوصف: تاريخ آخر تحديث للمفضلة
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'favorites',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['userId', 'itemType', 'itemId']
    },
    {
      fields: ['userId']
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

// ==================== تعريف العلاقات ====================
// العلاقة بين المفضلات والمستخدمين
Favorites.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Favorites, {
  foreignKey: 'userId',
  as: 'favorites'
});

// العلاقة بين المفضلات والمعارض (بدون قيد مرجعي)
Favorites.belongsTo(Exhibitions, {
  foreignKey: 'itemId',
  constraints: false,
  as: 'exhibition'
});

Exhibitions.hasMany(Favorites, {
  foreignKey: 'itemId',
  constraints: false,
  as: 'exhibitionFavorites',
  scope: {
    itemType: 'Exhibitions'
  }
});

// العلاقة بين المفضلات والمهرجانات والأحداث (بدون قيد مرجعي)
Favorites.belongsTo(FestivalsEvents, {
  foreignKey: 'itemId',
  constraints: false,
  as: 'festivalEvent'
});

FestivalsEvents.hasMany(Favorites, {
  foreignKey: 'itemId',
  constraints: false,
  as: 'festivalEventFavorites',
  scope: {
    itemType: 'FestivalsEvents'
  }
});

// ==================== التصدير ====================
module.exports = Favorites;