/*
ملف مسارات المستخدمين (users.js)
--------------------------------
*/

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const usersController = require("../controllers/users/users");
const {
  uploadUserImageWithCompression,
} = require("../controllers/services/mediaHelper");

// Middleware للتحقق من صحة معرف المستخدم (ID أو username) - للعرض العام
const validateUserIdentifier = [
  param("id")
    .custom((value) => {
      // التحقق من ID (رقم صحيح موجب)
      if (/^[1-9][0-9]*$/.test(value)) {
        return true;
      }
      // التحقق من username
      if (/^[a-zA-Z0-9._-]+$/.test(value) && value.length >= 1 && value.length <= 30) {
        return true;
      }
      throw new Error("Invalid user ID or username format");
    }),
];

// Middleware للتحقق من صحة معرف المستخدم (ID فقط) - للتحديث والحذف
const validateUserId = [
  param("id")
    .custom((value) => {
      // التحقق من ID (رقم صحيح موجب)
      if (/^[1-9][0-9]*$/.test(value)) {
        return true;
      }
      throw new Error("Invalid user ID format");
    }),
];

// Middleware للتحقق من بيانات تحديث المستخدم
const validateUpdateUser = [
  body("firstName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("First name must be between 2 and 50 characters"),
  body("lastName")
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage("Last name must be between 2 and 50 characters"),
  body("username")
    .optional()
    .isLength({ min: 3, max: 30 })
    .withMessage("Username must be between 3 and 30 characters")
    .matches(/^[a-zA-Z0-9._-]+$/)
    .withMessage(
      "Username can only contain letters, numbers, dots, underscores and dashes"
    ),
  body("email").optional().isEmail().withMessage("Invalid email format"),
  body("mobile")
    .optional()
    .matches(/^[0-9]{9,15}$/)
    .withMessage("Mobile must be between 9 and 15 digits"),
  body("isAdmin")
    .optional()
    .isBoolean()
    .withMessage("isAdmin must be a boolean"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];

// Middleware لمعالجة أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    const error = new Error("Validation errors");
    error.status = 400;
    error.errors = errorMsg;
    return next(error);
  }
  next();
};

// تحديث بيانات المستخدم (مع رفع صورة بروفايل)
router.put(
  "/:id",
  (req, res, next) => uploadUserImageWithCompression(req, res, next, true),
  validateUserId,
  validateUpdateUser,
  handleValidationErrors,
  usersController.updateUser
);

// عرض ملف شخصي عام (للجميع)
router.get(
  "/:id",
  validateUserIdentifier,
  handleValidationErrors,
  usersController.getProfile
);

// حذف مستخدم
router.delete(
  "/:id",
  validateUserId,
  handleValidationErrors,
  usersController.deleteUser
);

module.exports = router;
