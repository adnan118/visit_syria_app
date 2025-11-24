/*
ملف مسارات التجارب (experiences.js)
-------------------------------
وظيفة الملف:
- يحدد مسارات التجارب للوصول العام
- يشمل: الحصول على جميع التجارب، الحصول على تجربة محددة
- الوصول للقراءة فقط للعامة

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم التجارب
const experiencesController = require("../../controllers/ExploreSyria/experiencesController");

// ✅ مسارات التجارب العامة (وصول للقراءة فقط)

// الحصول على جميع التجارب
router.get("/", experiencesController.getAllExperiences);

// الحصول على تجربة محددة بالرقم المعرف
router.get("/:id", experiencesController.getExperienceById);

module.exports = router;