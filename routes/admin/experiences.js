/*
ملف مسارات إدارة التجارب (admin/experiences.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة التجارب للمشرفين فقط
- يشمل: إنشاء تجربة، تحديث تجربة، حذف تجربة
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم التجارب
const experiencesController = require("../../controllers/ExploreSyria/experiencesController");

// استيراد دالة رفع صور التجارب مع الضغط
const {
  uploadExperienceImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

// ✅ مسارات التجارب للمشرفين فقط

// إنشاء تجربة جديدة (مع رفع صور)
router.post("/", (req, res, next) => uploadExperienceImagesWithCompression(req, res, next), experiencesController.createExperience);

// تحديث تجربة (مع رفع صور)
router.put("/:id", (req, res, next) => uploadExperienceImagesWithCompression(req, res, next), experiencesController.updateExperience);

// حذف تجربة
router.delete("/:id", experiencesController.deleteExperience);

module.exports = router;