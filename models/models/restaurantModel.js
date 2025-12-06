/*
ملف نموذج المطعم (restaurantModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "المطعم" باستخدام Sequelize ORM
- يمثل جدول المطاعم في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمطاعم

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// استيراد نموذج المدينة
const City = require('./cityModel');

// تعريف نموذج المطعم باستخدام Sequelize
const Restaurant = sequelize.define('Restaurant', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },

  // معرف المدينة (مفتاح خارجي)
  cityId: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    allowNull: false,              // حقل مطلوب
    references: {
      model: City,                 // مرجع لنموذج المدينة
      key: 'id'                    // مرجع لعمود المعرف
    }
  },

  // اسم المطعم بالعربية
  name_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // اسم المطعم بالإنجليزية
  name_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // شرح بسيط بالعربية
  description_ar: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false                // حقل اختياري
  },

  // شرح بسيط بالإنجليزية
  description_en: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false                // حقل اختياري
  },

  // نوع المطبخ
  cuisineType: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      'Syrian',                    // سوري
      'Seafood',                   // بحري
      'Desserts',                  // حلويات
      'International',             // عالمي
      'Fast Food',                 // وجبات سريعة
      'Traditional'                // شعبي
    ),
    allowNull: false
  },

  // عدد النجوم (تقييم)
  rating: {
    type: DataTypes.DECIMAL(2, 1),  // نوع الحقل: رقم عشري (مثال: 4.5)
    allowNull: false,                // حقل اختياري
    validate: {
      min: 0,                       // أقل قيمة: 0
      max: 5                        // أعلى قيمة: 5
    }
  },

  // أوقات العمل
  openingHours: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      '24/7',                      // على مدار الساعة
      '08:00-16:00',               // من 8 صباحاً حتى 4 مساءً
      '09:00-17:00',               // من 9 صباحاً حتى 5 مساءً
      '10:00-22:00',               // من 10 صباحاً حتى 10 مساءً
      '12:00-24:00',               // من 12 ظهراً حتى 12 منتصف الليل
      '16:00-02:00'                // من 4 عصراً حتى 2 صباحاً
    ),
    allowNull: false,
    defaultValue: '09:00-17:00'    // القيمة الافتراضية: من 9 صباحاً حتى 5 مساءً
  },

  // أيام العمل
  workingDays: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      'All Week',                  // كل أيام الأسبوع
      'Sunday to Thursday',        // الأحد إلى الخميس
      'Saturday to Wednesday',     // السبت إلى الأربعاء
      'Monday to Friday',          // الاثنين إلى الجمعة
      'Custom Days'                // أيام مخصصة
    ),
    allowNull: false,
    defaultValue: 'All Week'       // القيمة الافتراضية: كل أيام الأسبوع
  },

  // الصور (كصفيف من الروابط)
  images: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: false,                // حقل اختياري
    defaultValue: []               // القيمة الافتراضية: مصفوفة فارغة
  },

  // أرقام الهاتف
  phoneNumbers: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false                // حقل مطلوب
  },

  // روابط التواصل الاجتماعي
  socialLinks: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: true,                // حقل اختياري
    defaultValue: {}               // القيمة الافتراضية: كائن فارغ
  },

  // نقطة الطول
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // نوع الحقل: رقم عشري
    allowNull: false                // حقل اختياري
  },

  // نقطة العرض
  longitude: {
    type: DataTypes.DECIMAL(11, 8), // نوع الحقل: رقم عشري
    allowNull: false                // حقل اختياري
  },

  // تاريخ الإنشاء
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW    // القيمة الافتراضية: الوقت الحالي
  },

  // تاريخ آخر تحديث
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }

}, {
  // اسم الجدول في قاعدة البيانات
  tableName: 'restaurants',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true,
  
  // إضافة getter methods للحصول على أسماء بالعربية والإنجليزية
  getterMethods: {
    // Getter method للحصول على نوع المطبخ بالعربية والإنجليزية
    cuisineTypeName() {
      const rawValue = this.getDataValue('cuisineType');
      if (!rawValue) return null;
      
      // Map English values to Arabic for getter
      const translations = {
        'Syrian': { en: 'Syrian', ar: 'سوري' },
        'Seafood': { en: 'Seafood', ar: 'بحري' },
        'Desserts': { en: 'Desserts', ar: 'حلويات' },
        'International': { en: 'International', ar: 'عالمي' },
        'Fast Food': { en: 'Fast Food', ar: 'وجبات سريعة' },
        'Traditional': { en: 'Traditional', ar: 'شعبي' }
      };
      
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    },
    
    // Getter method للحصول على أوقات العمل بالعربية والإنجليزية
    openingHoursName() {
      const rawValue = this.getDataValue('openingHours');
      if (!rawValue) return null;
      
      // Map time values to Arabic descriptions for getter
      const translations = {
        '24/7': { en: '24/7', ar: 'على مدار الساعة' },
        '08:00-16:00': { en: '08:00-16:00', ar: 'من 8 صباحاً حتى 4 مساءً' },
        '09:00-17:00': { en: '09:00-17:00', ar: 'من 9 صباحاً حتى 5 مساءً' },
        '10:00-22:00': { en: '10:00-22:00', ar: 'من 10 صباحاً حتى 10 مساءً' },
        '12:00-24:00': { en: '12:00-24:00', ar: 'من 12 ظهراً حتى 12 منتصف الليل' },
        '16:00-02:00': { en: '16:00-02:00', ar: 'من 4 عصراً حتى 2 صباحاً' }
      };
      
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    },
    
    // Getter method للحصول على أيام العمل بالعربية والإنجليزية
    workingDaysName() {
      const rawValue = this.getDataValue('workingDays');
      if (!rawValue) return null;
      
      // Map English values to Arabic for getter
      const translations = {
        'All Week': { en: 'All Week', ar: 'كل أيام الأسبوع' },
        'Sunday to Thursday': { en: 'Sunday to Thursday', ar: 'الأحد إلى الخميس' },
        'Saturday to Wednesday': { en: 'Saturday to Wednesday', ar: 'السبت إلى الأربعاء' },
        'Monday to Friday': { en: 'Monday to Friday', ar: 'الاثنين إلى الجمعة' },
        'Custom Days': { en: 'Custom Days', ar: 'أيام مخصصة' }
      };
      
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    }
  }
});

// تعريف العلاقة بين المطعم والمدن
Restaurant.belongsTo(City, {
  foreignKey: 'cityId',
  as: 'city'
});

City.hasMany(Restaurant, {
  foreignKey: 'cityId',
  as: 'restaurants'
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = Restaurant;