/*
ملف مسارات إدارة المرشدين السياحيين (admin/tourGuides.js)
------------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة المرشدين السياحيين للمشرفين فقط
- يشمل: إنشاء مرشد، تحديث مرشد، حذف مرشد
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المرشدين السياحيين
const tourGuidesController = require("../../controllers/ExploreSyria/tourGuidesController");

// استيراد دالة رفع صورة المرشد السياحي مع الضغط
const {
  uploadTourGuideImageWithCompression,
} = require("../../controllers/services/mediaHelper");

// ✅ مسارات المرشدين السياحيين للمشرفين فقط

// إنشاء مرشد سياحي جديد (مع رفع صورة)
router.post("/", (req, res, next) => uploadTourGuideImageWithCompression(req, res, next), tourGuidesController.createTourGuide);

// تحديث مرشد سياحي (مع رفع صورة)
router.put("/:id", (req, res, next) => uploadTourGuideImageWithCompression(req, res, next), tourGuidesController.updateTourGuide);

// حذف مرشد سياحي
router.delete("/:id", tourGuidesController.deleteTourGuide);

module.exports = router;