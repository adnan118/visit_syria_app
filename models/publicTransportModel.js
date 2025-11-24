/*
ملف نموذج وسائل المواصلات العامة (publicTransportModel.js)
--------------------------------------------------
وظيفة الملف:
- يحدد نموذج "PublicTransport" باستخدام Sequelize ORM
- يمثل جدول PublicTransport في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة لوسائل المواصلات العامة
المكتبات المستخدمة:
- DataTypes: لأنواع البيانات في Sequelize
- sequelize: كائن ORM المهيأ للتفاعل مع قاعدة البيانات
*/
// استيراد أنواع البيانات من مكتبة Sequelize
const { DataTypes } = require('sequelize');
// استيراد كائن sequelize المهيأ من ملف الإعداد
const sequelize = require('./sequelize');
// تعريف نموذج PublicTransport باستخدام Sequelize
const PublicTransport = sequelize.define('PublicTransport', {
  // المعرف الفريد لكل سجل
  id: {
    type: DataTypes.INTEGER,        // نوع الحقل: عدد صحيح
    primaryKey: true,              // المفتاح الأساسي
    autoIncrement: true            // يزيد تلقائياً
  },
  // الاسم بالعربية
  name_ar: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },
  // الاسم بالإنجليزية
  name_en: {
    type: DataTypes.STRING,         // نوع الحقل: نص قصير
    allowNull: false               // حقل مطلوب
  },
  // الوصف بالعربية
  description_ar: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false               // حقل مطلوب
  },
  // الوصف بالإنجليزية
  description_en: {
    type: DataTypes.TEXT,           // نوع الحقل: نص طويل
    allowNull: false               // حقل مطلوب
  },
  // مجموعة صور (روابط الصور كمصفوفة JSON)
  images: {
    type: DataTypes.JSON,           // نوع الحقل: JSON
    allowNull: false,               // حقل مطلوب
    defaultValue: []               // القيمة الافتراضية: مصفوفة فارغة
  },
  // وسائل الدفع
  paymentMethods: {
    type: DataTypes.ENUM(           // نوع الحقل: قائمة من القيم المحددة
      'Prepaid_Transport_Cards',    // بطاقات الدفع المسبق للمواصلات
      'Mobile_Payment_Apps',        // تطبيقات الدفع عبر الهاتف
      'Apple_Google_Pay',           // Apple Pay / Google Pay
      'Subscription_Cards',         // بطاقات المشترك الشهرية/الأسبوعية
      'Electronic_Tickets'          // التذاكر الإلكترونية عبر التطبيقات
    ),
    allowNull: false,
    defaultValue: 'Prepaid_Transport_Cards'  // القيمة الافتراضية: بطاقات الدفع المسبق
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
  tableName: 'public_transport',
  // تفعيل الحقول التلقائية (createdAt و updatedAt)
  timestamps: true,
  // إضافة getter methods للحصول على أسماء بالعربية والإنجليزية
  getterMethods: {
    // Getter method للحصول على وسائل الدفع بالعربية والإنجليزية
    paymentMethodsName() {
      const rawValue = this.getDataValue('paymentMethods');
      if (!rawValue) return null;
      // Map payment methods to Arabic and English descriptions
      const translations = {
        'Prepaid_Transport_Cards': { 
          en: 'Prepaid Transport Cards', 
          ar: 'بطاقات الدفع المسبق للمواصلات' 
        },
        'Mobile_Payment_Apps': { 
          en: 'Mobile Payment Apps', 
          ar: 'تطبيقات الدفع عبر الهاتف' 
        },
        'Apple_Google_Pay': { 
          en: 'Apple Pay / Google Pay', 
          ar: 'Apple Pay / Google Pay' 
        },
        'Subscription_Cards': { 
          en: 'Subscription Cards (Monthly/Weekly)', 
          ar: 'بطاقات المشترك الشهرية/الأسبوعية' 
        },
        'Electronic_Tickets': { 
          en: 'Electronic Tickets via Apps', 
          ar: 'التذاكر الإلكترونية عبر التطبيقات' 
        }
      };
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    }
  }
});
// تصدير النموذج للاستخدام في بقية المشروع
module.exports = PublicTransport;