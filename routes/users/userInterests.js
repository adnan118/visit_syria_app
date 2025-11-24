/*
ملف مسارات اهتمامات المستخدمين (userInterests.js)
----------------------------------------------
*/

const express = require("express");
const router = express.Router();
const { body, param, validationResult } = require("express-validator");
const userInterestsController = require("../../controllers/users/userInterests");

// Middleware للتحقق من صحة معرف المستخدم
const validateUserId = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("Invalid user ID format")
];

// Middleware للتحقق من صحة معرف التاغ
const validateTagId = [
  param("tagId")
    .isInt({ min: 1 })
    .withMessage("Invalid tag ID format")
];

// Middleware للتحقق من بيانات إضافة اهتمامات
const validateAddInterests = [
  body("tagIds")
    .isArray({ min: 1 })
    .withMessage("tagIds must be an array with at least one element")
    .custom((value) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error("All tag IDs must be positive integers");
      }
      return true;
    })
];

// Middleware للتحقق من بيانات إزالة اهتمامات متعددة
const validateRemoveInterests = [
  body("tagIds")
    .isArray({ min: 1 })
    .withMessage("tagIds must be an array with at least one element")
    .custom((value) => {
      if (!value.every(id => Number.isInteger(id) && id > 0)) {
        throw new Error("All tag IDs must be positive integers");
      }
      return true;
    })
];

// Middleware لمعالجة أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }));
    const error = new Error("Validation errors");
    error.status = 400;
    error.errors = errorMsg;
    console.log('Validation errors:', JSON.stringify(errorMsg, null, 2));
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request params:', JSON.stringify(req.params, null, 2));
    return next(error);
  }
  next();
};

// إضافة اهتمامات للمستخدم
router.post(
  "/:userId/interests",
  validateUserId,
  validateAddInterests,
  handleValidationErrors,
  userInterestsController.addInterests
);

// تحديث جميع اهتمامات المستخدم دفعة واحدة
router.put(
  "/:userId/interests",
  validateUserId,
  validateAddInterests,
  handleValidationErrors,
  userInterestsController.updateAllInterests
);

// عرض اهتمامات المستخدم
router.get(
  "/:userId/interests",
  validateUserId,
  handleValidationErrors,
  userInterestsController.getUserInterests
);

// إزالة اهتمام معين من المستخدم
router.delete(
  "/:userId/interests/:tagId",
  validateUserId,
  validateTagId,
  handleValidationErrors,
  userInterestsController.removeInterest
);

 

// إزالة جميع اهتمامات المستخدم
router.delete(
  "/:userId/interests",
  validateUserId,
  handleValidationErrors,
  userInterestsController.removeAllInterests
);

module.exports = router;