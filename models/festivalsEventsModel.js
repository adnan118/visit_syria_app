/*ملف نموذج المهرجانات والأحداث (festivalsEventsModel.js)
----------------------------------
وظيفة الملف:
- يحدد نموذج "المهرجانات والأحداث" باستخدام Sequelize ORM
- يمثل جدول المهرجانات والأحداث في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمهرجانات والأحداث

المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/

// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');

// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');

// تعريف نموذج المهرجانات والأحداث باستخدام Sequelize
const FestivalsEvents = sequelize.define('FestivalsEvents', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },

  // اسم المكان باللغة العربية
  placeAr: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    field: 'place_ar'              // اسم الحقل في قاعدة البيانات
  },

  // اسم المكان باللغة الإنجليزية
  placeEn: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false,              // حقل مطلوب
    field: 'place_en'              // اسم الحقل في قاعدة البيانات
  },

  // نقطة الطول
  latitude: {
    type: DataTypes.DECIMAL(10, 8), // نوع الحقل: رقم عشري
    allowNull: false                // حقل مطلوب
  },

  // نقطة العرض
  longitude: {
    type: DataTypes.DECIMAL(11, 8), // نوع الحقل: رقم عشري
    allowNull: false                // حقل مطلوب
  },

  // التاريخ والوقت
  dateTime: {
    type: DataTypes.DATE,           // نوع الحقل: تاريخ ووقت
    allowNull: false               // حقل مطلوب
  },

  // الهدف أو الوصف باللغة العربية
  descriptionAr: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false,              // حقل مطلوب
    field: 'description_ar'        // اسم الحقل في قاعدة البيانات
  },

  // الهدف أو الوصف باللغة الإنجليزية
  descriptionEn: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false,              // حقل مطلوب
    field: 'description_en'        // اسم الحقل في قاعدة البيانات
  },

  // الصور والفيديوهات (كصفيف من الروابط)
  media: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: true,                // حقل اختياري
    defaultValue: []               // القيمة الافتراضية: مصفوفة فارغة
  },

  // الداعم الرسمي للحدث باللغة العربية
  officialSupporterAr: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'official_supporter_ar' // اسم الحقل في قاعدة البيانات
  },

  // الداعم الرسمي للحدث باللغة الإنجليزية
  officialSupporterEn: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'official_supporter_en' // اسم الحقل في قاعدة البيانات
  },

  // مدة الحدث باللغة العربية
  durationAr: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'duration_ar'           // اسم الحقل في قاعدة البيانات
  },

  // مدة الحدث باللغة الإنجليزية
  durationEn: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'duration_en'           // اسم الحقل في قاعدة البيانات
  },

  // كلفة الحدث
  cost: {
    type: DataTypes.DECIMAL(10, 2), // نوع الحقل: رقم عشري
    allowNull: true                // حقل اختياري
  },

  // الفئة المستهدفة من الجمهور باللغة العربية
  targetAudienceAr: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'target_audience_ar'    // اسم الحقل في قاعدة البيانات
  },

  // الفئة المستهدفة من الجمهور باللغة الإنجليزية
  targetAudienceEn: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: true,               // حقل اختياري
    field: 'target_audience_en'    // اسم الحقل في قاعدة البيانات
  },

  // ملاحظات باللغة العربية
  notesAr: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: true,               // حقل اختياري
    field: 'notes_ar'              // اسم الحقل في قاعدة البيانات
  },

  // ملاحظات باللغة الإنجليزية
  notesEn: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: true,               // حقل اختياري
    field: 'notes_en'              // اسم الحقل في قاعدة البيانات
  },

  // تصنيف الفعالية أو المهرجان
  classification: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      'art',                       // فنون
      'history',                   // تاريخ
      'science',                   // علوم
      'culture',                   // ثقافة
      'technology',                // تكنولوجيا
      'literature',                // أدب
      'music',                     // موسيقى
      'photography',               // تصوير
      'crafts',                    // حرفيات
      'food',                      // طعام
      'fashion',                   // أزياء
      'nature',                    // طبيعة
      'religion',                  // دين
      'sports',                    // رياضة
      'other'                      // أخرى
    ),
    allowNull: true,               // حقل اختياري
    field: 'classification'        // اسم الحقل في قاعدة البيانات
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
  tableName: 'festivals_events',
  
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true,
  
  // إضافة getter methods للحقول
  getterMethods: {
    // Getter method للحصول على تسمية التصنيف باللغتين العربية والإنجليزية
    classificationLabel() {
      const classificationLabels = {
        'art': { ar: 'فنون', en: 'Art' },
        'history': { ar: 'تاريخ', en: 'History' },
        'science': { ar: 'علوم', en: 'Science' },
        'culture': { ar: 'ثقافة', en: 'Culture' },
        'technology': { ar: 'تكنولوجيا', en: 'Technology' },
        'literature': { ar: 'أدب', en: 'Literature' },
        'music': { ar: 'موسيقى', en: 'Music' },
        'photography': { ar: 'تصوير', en: 'Photography' },
        'crafts': { ar: 'حرفيات', en: 'Crafts' },
        'food': { ar: 'طعام', en: 'Food' },
        'fashion': { ar: 'أزياء', en: 'Fashion' },
        'nature': { ar: 'طبيعة', en: 'Nature' },
        'religion': { ar: 'دين', en: 'Religion' },
        'sports': { ar: 'رياضة', en: 'Sports' },
        'other': { ar: 'أخرى', en: 'Other' }
      };
      
      // إرجاع تسمية "أخرى" كقيمة افتراضية إذا لم يتم تعيين التصنيف
      return classificationLabels[this.classification || 'other'];
    },
    
    // Getter method للحصول على تسمية التصنيف باللغة العربية
    classification_ar() {
      const classificationLabels = {
        'art': 'فنون',
        'history': 'تاريخ',
        'science': 'علوم',
        'culture': 'ثقافة',
        'technology': 'تكنولوجيا',
        'literature': 'أدب',
        'music': 'موسيقى',
        'photography': 'تصوير',
        'crafts': 'حرفيات',
        'food': 'طعام',
        'fashion': 'أزياء',
        'nature': 'طبيعة',
        'religion': 'دين',
        'sports': 'رياضة',
        'other': 'أخرى'
      };
      
      // إرجاع تسمية "أخرى" كقيمة افتراضية إذا لم يتم تعيين التصنيف
      return classificationLabels[this.classification || 'other'];
    },
    
    // Getter method للحصول على تسمية التصنيف باللغة الإنجليزية
    classification_en() {
      const classificationLabels = {
        'art': 'Art',
        'history': 'History',
        'science': 'Science',
        'culture': 'Culture',
        'technology': 'Technology',
        'literature': 'Literature',
        'music': 'Music',
        'photography': 'Photography',
        'crafts': 'Crafts',
        'food': 'Food',
        'fashion': 'Fashion',
        'nature': 'Nature',
        'religion': 'Religion',
        'sports': 'Sports',
        'other': 'Other'
      };
      
      // إرجاع تسمية "Other" كقيمة افتراضية إذا لم يتم تعيين التصنيف
      return classificationLabels[this.classification || 'other'];
    }
  }
});

// تصدير النموذج للاستخدام في بقية المشروع
module.exports = FestivalsEvents;
