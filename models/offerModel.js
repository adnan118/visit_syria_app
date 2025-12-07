/*
ملف نموذج العرض (offerModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "العرض" باستخدام Sequelize ORM
- يمثل جدول العروض في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للعروض

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

// تعريف نموذج العرض باستخدام Sequelize
const Offer = sequelize.define('Offer', {
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

  // اسم المنشأة بالعربية
  establishmentName_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // اسم المنشأة بالإنجليزية
  establishmentName_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // اسم العرض بالعربية
  offerName_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // اسم العرض بالإنجليزية
  offerName_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },

  // قيمة الخصم (نسبة مئوية)
  discountValue: {
    type: DataTypes.DECIMAL(5, 2),  // نوع الحقل: رقم عشري (مثال: 25.50)
    allowNull: false,               // حقل مطلوب
    validate: {
      min: 0,                       // أقل قيمة: 0
      max: 100                      // أعلى قيمة: 100
    }
  },

  // السعر قبل الخصم
  priceBefore: {
    type: DataTypes.DECIMAL(10, 2), // نوع الحقل: رقم عشري
    allowNull: false               // حقل مطلوب
  },

  // السعر بعد الخصم
  priceAfter: {
    type: DataTypes.DECIMAL(10, 2), // نوع الحقل: رقم عشري
    allowNull: false               // حقل مطلوب
  },

  // شرح العرض بالعربية
  description_ar: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false               // حقل مطلوب
  },

  // شرح العرض بالإنجليزية
  description_en: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false               // حقل مطلوب
  },

  // الصور (كصفيف من الروابط)
  images: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: true,                // حقل اختياري
    defaultValue: []               // القيمة الافتراضية: مصفوفة فارغة
  },

  // نقطة الطول
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // نوع الحقل: رقم عشري
    allowNull: true                // حقل اختياري
  },

  // نقطة العرض
  longitude: {
    type: DataTypes.DECIMAL(11, 8), // نوع الحقل: رقم عشري
    allowNull: true                // حقل اختياري
  },

  // تصنيف المنشأة (enum)
  establishmentType: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      'Restaurant',                 // مطعم
      'Cafeteria',                  // كافتيريا
      'Hotel',                      // فندق
      'Tourist Attraction',         // معلم سياحي
      'Museum',                     // متحف
      'Historical Site',            // موقع تاريخي
      'Beach Resort',               // منتجع شاطئي
      'Mountain Resort',            // منتجع جبلي
      'Cultural Center',            // مركز ثقافي
      'Shopping Mall',              // مركز تسوق
      'Park',                       // حديقة
      'Zoo',                        // حديقة حيوان
      'Amusement Park',             // مدينة ألعاب
      'Spa & Wellness',             // سبا ورفاهية
       
      'Nightclub',                  // نادي ليلي
   
      'Cafe',                       // مقهى
      'Fast Food',                  // طعام سريع
      'Fine Dining',                // طعام فاخر
      'Local Cuisine',              // مأكولات محلية
      'Street Food',                // طعام شارعي
      'Other'                       // أخرى
    ),
    allowNull: false
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
  tableName: 'offers',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true,
  
  // إضافة getter methods للحصول على أسماء بالعربية والإنجليزية
  getterMethods: {
    // Getter method للحصول على نوع المنشأة بالعربية والإنجليزية
    establishmentTypeName() {
      const rawValue = this.getDataValue('establishmentType');
      if (!rawValue) return null;
      
      // Map English values to Arabic for getter
      const translations = {
        'Restaurant': { en: 'Restaurant', ar: 'مطعم' },
        'Cafeteria': { en: 'Cafeteria', ar: 'كافتيريا' },
        'Hotel': { en: 'Hotel', ar: 'فندق' },
        'Tourist Attraction': { en: 'Tourist Attraction', ar: 'معلم سياحي' },
        'Museum': { en: 'Museum', ar: 'متحف' },
        'Historical Site': { en: 'Historical Site', ar: 'موقع تاريخي' },
        'Beach Resort': { en: 'Beach Resort', ar: 'منتجع شاطئي' },
        'Mountain Resort': { en: 'Mountain Resort', ar: 'منتجع جبلي' },
        'Cultural Center': { en: 'Cultural Center', ar: 'مركز ثقافي' },
        'Shopping Mall': { en: 'Shopping Mall', ar: 'مركز تسوق' },
        'Park': { en: 'Park', ar: 'حديقة' },
        'Zoo': { en: 'Zoo', ar: 'حديقة حيوان' },
        'Amusement Park': { en: 'Amusement Park', ar: 'مدينة ألعاب' },
        'Spa & Wellness': { en: 'Spa & Wellness', ar: 'سبا ورفاهية' },
        
        'Nightclub': { en: 'Nightclub', ar: 'نادي ليلي' },
        
        'Cafe': { en: 'Cafe', ar: 'مقهى' },
        'Fast Food': { en: 'Fast Food', ar: 'طعام سريع' },
        'Fine Dining': { en: 'Fine Dining', ar: 'طعام فاخر' },
        'Local Cuisine': { en: 'Local Cuisine', ar: 'مأكولات محلية' },
        'Street Food': { en: 'Street Food', ar: 'طعام شارعي' },
        'Other': { en: 'Other', ar: 'أخرى' }
      };
      
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    }
  }
});

// تعريف العلاقة بين العروض والمدن
Offer.belongsTo(City, {
  foreignKey: 'cityId',
  as: 'city'
});

City.hasMany(Offer, {
  foreignKey: 'cityId',
  as: 'offers'
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = Offer;
