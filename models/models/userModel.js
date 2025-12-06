/*
 * ملف نموذج المستخدم (userModel.js)
 * ===============================
 * 
 * الوظيفة:
 * --------
 * - تعريف نموذج المستخدم (User Model) باستخدام Sequelize ORM
 * - تمثيل جدول المستخدمين في قاعدة البيانات
 * - تحديد جميع حقول المستخدم والتحقق من صحتها
 * 
 * الحقول المعرفة:
 * -------------
 * - المعلومات الأساسية: id, firstName, lastName, email, mobile
 * - الأمان: passwordHash, emailVerified, isActive
 * - الحساب: provider, image, isAdmin
 * - التواريخ: createdAt, updatedAt
 * - التحكم: isDeactivated, deactivatedUntil, resetPasswordOtp
 * - التكامل: googleId, facebookId, firebaseUid
 */

// ==================== الاستيراد ====================
const { DataTypes, Op } = require('sequelize');
const sequelize = require('./sequelize');

// ==================== تعريف النموذج ====================
const User = sequelize.define('User', {
  /*
   * الحقل: id
   * --------
   * - النوع: عدد صحيح
   * - الخاصية: المفتاح الأساسي + تزايد تلقائي
   * - الوصف: المعرف الفريد لكل مستخدم
   */
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  /*
   * الحقل: firstName
   * ---------------
   * - النوع: نص
   * - الخاصية: إجباري عند التسجيل المحلي
   * - الوصف: الاسم الأول للمستخدم
   */
  firstName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "First name is required"
      }
    }
  },
  
  /*
   * الحقل: lastName
   * --------------
   * - النوع: نص
   * - الخاصية: إجباري عند التسجيل المحلي
   * - الوصف: اسم العائلة للمستخدم
   */
  lastName: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Last name is required"
      }
    }
  },
  
  /*
   * الحقل: username
   * --------------
   * - النوع: نص
   * - الخاصية: فريد
   * - الوصف: اسم المستخدم
   */
  username: {
    type: DataTypes.STRING,
    unique: true
  },
  
  /*
   * الحقل: email
   * -----------
   * - النوع: نص
   * - الخاصية: فريد + إجباري عند التسجيل المحلي + تحقق من الصحة
   * - الوصف: البريد الإلكتروني للمستخدم
   */
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: {
        msg: "Please enter a valid email"
      },
      notEmpty: {
        msg: "Email is required"
      }
    }
  },
  
  /*
   * الحقل: mobile
   * ------------
   * - النوع: نص
   * - الخاصية: إجباري عند التسجيل المحلي
   * - الوصف: رقم الهاتف المحمول
   */
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: "Mobile is required"
      },
      is: {
        args: /^[0-9]{9,15}$/,
        msg: "Please enter a valid phone"
      }
    }
  },
  
  /*
   * الحقل: passwordHash
   * ------------------
   * - النوع: نص
   * - الوصف: كلمة المرور المشفرة
   */
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  /*
   * الحقل: image
   * -----------
   * - النوع: نص
   * - الوصف: رابط صورة الملف الشخصي
   */
  image: {
    type: DataTypes.STRING,
    defaultValue: "default-user.png"
  },
  
  /*
   * الحقل: bio
   * ---------
   * - النوع: نص
   * - الوصف: نبذة عن المستخدم
   */
  bio: {
    type: DataTypes.TEXT
  },
  
  /*
   * الحقل: provider
   * --------------
   * - النوع: قيمة من مجموعة محددة (local/google/facebook)
   * - القيمة الافتراضية: local
   * - الوصف: مزود الخدمة (local, google, facebook)
   */
  provider: {
    type: DataTypes.ENUM('local', 'google', 'facebook'),
    defaultValue: 'local'
  },
  
  /*
   * الحقل: googleId
   * --------------
   * - النوع: نص
   * - الوصف: معرف المستخدم لدى Google
   */
  googleId: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: facebookId
   * ----------------
   * - النوع: نص
   * - الوصف: معرف المستخدم لدى Facebook
   */
  facebookId: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: firebaseUid
   * -----------------
   * - النوع: نص
   * - الوصف: معرف المستخدم لدى Firebase
   */
  firebaseUid: {
    type: DataTypes.STRING
  },
  
  /*
   * الحقل: emailVerified
   * -------------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: false
   * - الوصف: حالة التحقق من البريد الإلكتروني
   */
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  /*
   * الحقل: isAdmin
   * -------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: false
   * - الوصف: هل المستخدم مدير؟
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
   * - الوصف: حالة تفعيل الحساب
   */
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  /*
   * الحقل: isDeactivated
   * -------------------
   * - النوع: قيمة منطقية
   * - القيمة الافتراضية: false
   * - الوصف: حالة تعطيل الحساب
   */
  isDeactivated: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  /*
   * الحقل: deactivatedUntil
   * ----------------------
   * - النوع: تاريخ ووقت
   * - الوصف: تاريخ انتهاء تعطيل الحساب (إن وجد)
   */
  deactivatedUntil: {
    type: DataTypes.DATE
  },
  
  /*
   * الحقل: resetPasswordOtp
   * ----------------------
   * - النوع: عدد صحيح
   * - الوصف: رمز OTP لإعادة تعيين كلمة المرور
   */
  resetPasswordOtp: {
    type: DataTypes.INTEGER
  },
  
  /*
   * الحقل: resetPasswordOtpExpires
   * -----------------------------
   * - النوع: تاريخ ووقت
   * - الوصف: تاريخ انتهاء صلاحية رمز OTP
   */
  resetPasswordOtpExpires: {
    type: DataTypes.DATE
  },
  
  /*
   * الحقل: createdAt
   * ---------------
   * - النوع: تاريخ ووقت
   * - القيمة الافتراضية: الوقت الحالي
   * - الوصف: تاريخ إنشاء الحساب
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
   * - الوصف: تاريخ آخر تحديث للحساب
   */
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'users',
  timestamps: true,
  // تعريف الفهارس
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['googleId'],
      where: {
        googleId: {
          [Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['facebookId'],
      where: {
        facebookId: {
          [Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['firebaseUid'],
      where: {
        firebaseUid: {
          [Op.ne]: null
        }
      }
    }
  ],
  getterMethods: {
    /*
     * مسار الصورة النهائي للواجهة الأمامية
     */
    imageUrl: function() {
      const file = this.image || "default-user.png";
      return `/public/uploads/images/users/${file}`;
    }
  }
});

// ==================== التصدير ====================
module.exports = User;