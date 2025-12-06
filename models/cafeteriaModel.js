/*
ملف نموذج الكافتيريا (cafeteriaModel.js)
-----------------------------------
وظيفة الملف:
- يحدد هيكل جدول الكافتيريا في قاعدة البيانات
- يربط النموذج بجدول cafeterias في قاعدة البيانات
- يحدد العلاقات مع النماذج الأخرى (مثل المدن)
*/

const { DataTypes } = require('sequelize');
const sequelize = require('./sequelize');
const City = require('./cityModel');

// تعريف نموذج الكافتيريا
const Cafeteria = sequelize.define('Cafeteria', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'اسم الكافتيريا'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'وصف الكافتيريا'
  },
  address: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'عنوان الكافتيريا'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'رقم الهاتف'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'البريد الإلكتروني'
  },
  website: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'موقع الويب'
  },
  opening_hours: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'أوقات العمل'
  },
  price_range: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'نطاق الأسعار'
  },
  cuisine_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'نوع المطبخ'
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'خط العرض'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'خط الطول'
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'رابط الصورة'
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    comment: 'التقييم'
  }
}, {
  tableName: 'cafeterias',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: 'جدول الكافتيريا'
});

// تعريف العلاقة مع المدن
Cafeteria.belongsTo(City, {
  foreignKey: 'city_id',
  as: 'city'
});

module.exports = Cafeteria;