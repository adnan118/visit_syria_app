/**
 * معالج أخطاء JWT (errorHandlerMiddleWares.js)
 * --------------------------------------------
 * هذا الملف متخصص في معالجة أخطاء JWT وتجديد الـ tokens
 * يعمل مع errorHandler.js العام لمعالجة جميع أنواع الأخطاء
 */

const jwt = require('jsonwebtoken'); 
const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const sequelize = require('../models/sequelize');
const { Op } = require('sequelize');
 
async function errorHandlerMiddleWares(err, req, res, next) {
  // التحقق من أن الخطأ هو خطأ JWT
  if (err.name === 'UnauthorizedError') {
    
    // إذا كان المسار هو firebase-login، لا تتدخل واتركه للكنترولر
    if (req.originalUrl && req.originalUrl.includes('/firebase-login')) {
      return next(err);
    }
    
    // إذا كان الخطأ ليس بسبب انتهاء صلاحية JWT
    if (!err.message.includes('jwt expired')) {
      return res.status(err.status || 401).json({
        status: "failure",
        message: "Invalid or missing token"
      });
    }

    try {
      // استخراج الـ access token من الـ header
      const tokenHeader = req.header('Authorization');
      if (!tokenHeader) {
        return res.status(401).json({
          status: "failure",
          message: "No authorization header provided"
        });
      }

      const accessToken = tokenHeader.split(' ')[1];
      
      // البحث عن الـ token في قاعدة البيانات
      const token = await Token.findOne({
        where: { 
          accessToken: accessToken,
          refreshToken: { [Op.ne]: null }
        }
      });

      if (!token) {
        return res.status(401).json({
          status: "failure",
          message: "Token not found in database"
        });
      }

      // التحقق من صحة الـ refresh token
      const userData = jwt.verify(token.refreshToken, process.env.REFRESH_TOKEN_SECRET || require('../config').REFRESH_TOKEN_SECRET);
      const user = await User.findByPk(userData.id);
      
      if (!user) {
        return res.status(404).json({
          status: "failure",
          message: "User not found"
        });
      }

      // إنشاء access token جديد مع نفس الحقول المستخدمة في النظام
      const cfg = require('../config');
      const payload = {
        id: user.id,
        userId: user.id,
        firstName: user.firstName,
        email: user.email,
        mobile: user.mobile,
        isActive: user.isActive,
      };
      const newAccessToken = jwt.sign(
        payload,
        process.env.ACCESS_TOKEN_SECRET || cfg.ACCESS_TOKEN_SECRET,
        { expiresIn: '24h' }
      );

      // تحديث الـ token في قاعدة البيانات
      await token.update({ accessToken: newAccessToken });

      // إضافة الـ token الجديد للـ headers
      req.headers['authorization'] = `Bearer ${newAccessToken}`;
      res.set('Authorization', `Bearer ${newAccessToken}`);

      // تعبئة req.auth حتى تتمكن الكنترولرات من استخدام userId مباشرة
      try {
        const verified = jwt.verify(newAccessToken, process.env.ACCESS_TOKEN_SECRET || cfg.ACCESS_TOKEN_SECRET);
        req.auth = verified;
      } catch (_) {
        // fallback للتأكد من وجود بعض البيانات
        req.auth = payload;
      }

      // الانتقال للخطوة التالية مع الـ token الجديد
      return next();

    } catch (refreshError) {
      return res.status(401).json({
        status: "failure",
        message: "Token refresh failed. Please login again"
      });
    }
  }

  // إذا لم يكن خطأ JWT، انتقل للخطوة التالية
  return next(err);
}

 
module.exports = errorHandlerMiddleWares;