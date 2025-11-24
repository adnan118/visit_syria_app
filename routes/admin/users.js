/*
ملف مسارات إدارة المستخدمين (admin/users.js)
------------------------------------------
- يحتوي على جميع مسارات إدارة المستخدمين للوحة الإدارة
- يتطلب صلاحيات إدارية للوصول لهذه المسارات
*/

const express = require("express");
const router = express.Router();
const adminUsersController = require("../../controllers/admin/users");
const { param, query, body, validationResult } = require("express-validator");
const {
  uploadUserImageWithCompression,
} = require("../../controllers/services/mediaHelper");

// Middleware للتحقق من صحة معرف المستخدم
const validateUserId = [
  param("id")
    .custom((value) => {
      // التحقق من ID (رقم صحيح موجب)
      if (/^[1-9][0-9]*$/.test(value)) {
        return true;
      }
      throw new Error("Invalid user ID format");
    })
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

// Middleware للتحقق من معلمات التصفح
const validatePagination = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100")
];

// Middleware للتحقق من معلمات الترتيب
const validateSorting = [
  query("sortBy")
    .optional()
    .isIn(['firstName', 'lastName', 'username', 'email', 'createdAt', 'isActive', 'isAdmin'])
    .withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage("Sort order must be 'asc' or 'desc'")
];

// Middleware للتحقق من معلمات التصفية
const validateFiltering = [
  query("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  query("isAdmin")
    .optional()
    .isBoolean()
    .withMessage("isAdmin must be a boolean")
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

// عرض جميع المستخدمين (للإدارة)
router.get(
  "/",
  validatePagination,
  validateSorting,
  validateFiltering,
  handleValidationErrors,
  adminUsersController.getAllUsers
);

// عرض مستخدم محدد حسب المعرف (للإدارة)
router.get(
  "/:id",
  validateUserId,
  handleValidationErrors,
  adminUsersController.getUserById
);

// تحديث بيانات المستخدم (للإدارة)
router.put(
  "/:id",
  (req, res, next) => uploadUserImageWithCompression(req, res, next, true),
  validateUserId,
  validateUpdateUser,
  handleValidationErrors,
  adminUsersController.updateUser
);

// حذف مستخدم (للإدارة)
router.delete(
  "/:id",
  validateUserId,
  handleValidationErrors,
  adminUsersController.deleteUser
);

module.exports = router;