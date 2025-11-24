/*
ملف مسارات المرشدين السياحيين (tourGuides.js)
-------------------------------
وظيفة الملف:
- يحدد مسارات المرشدين السياحيين للوصول العام
- يشمل: الحصول على جميع المرشدين، الحصول على مرشد محدد
- الوصول للقراءة فقط للعامة

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المرشدين السياحيين
const tourGuidesController = require("../../controllers/ExploreSyria/tourGuidesController");

// ✅ مسارات المرشدين السياحيين العامة (وصول للقراءة فقط)

// الحصول على جميع المرشدين السياحيين
router.get("/", tourGuidesController.getAllTourGuides);

// الحصول على مرشد سياحي محدد بالرقم المعرف
router.get("/:id", tourGuidesController.getTourGuideById);

module.exports = router;