/*
ملف مسارات إدارة المنشورات (admin/posts.js)
------------------------------------------
- يحتوي على جميع مسارات إدارة المنشورات للوحة الإدارة
- يتطلب صلاحيات إدارية للوصول لهذه المسارات
*/

const express = require("express");
const router = express.Router();
const adminPostsController = require("../../controllers/admin/posts");
const { param, query, body, validationResult } = require("express-validator");

// Middleware للتحقق من صحة معرف المنشور
const validatePostId = [
  param("id")
    .isMongoId()
    .withMessage("Invalid post ID format")
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

// Middleware للتحقق من بيانات رفض المنشور
const validateRejectPost = [
  body("rejectionReason")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Rejection reason must be less than 500 characters")
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

// عرض جميع المنشورات المعلقة (للإدارة)
router.get(
  "/pending",
  validatePagination,
  handleValidationErrors,
  adminPostsController.getPendingPosts
);

// عرض جميع المنشورات بغض النظر عن الحالة (للإدارة)
router.get(
  "/",
  validatePagination,
  handleValidationErrors,
  adminPostsController.getAllPosts
);

// عرض منشور محدد حسب المعرف (للإدارة)
router.get(
  "/:id",
  validatePostId,
  handleValidationErrors,
  adminPostsController.getPostById
);

// الموافقة على منشور (للإدارة)
router.post(
  "/:id/approve",
  validatePostId,
  handleValidationErrors,
  adminPostsController.approvePost
);

// رفض منشور (للإدارة)
router.post(
  "/:id/reject",
  validatePostId,
  validateRejectPost,
  handleValidationErrors,
  adminPostsController.rejectPost
);

module.exports = router;