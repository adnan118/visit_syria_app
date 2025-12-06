/*
ملف مسارات الفنون والثقافة (artsCulture.js)
----------------------------------------
وظيفة الملف:
- يحدد مسارات الفنون والثقافة للوصول العام
- يشمل: الحصول على جميع سجلات الفنون والثقافة، الحصول على سجل محدد
- الوصول للقراءة فقط للعامة

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم الفنون والثقافة
const artsCultureController = require("../../controllers/ExploreSyria/artsCultureController");

// ✅ مسارات الفنون والثقافة العامة (وصول للقراءة فقط)
// الحصول على جميع سجلات الفنون والثقافة
router.get("/", artsCultureController.getAllArtsCulture);

// الحصول على سجل فنون وثقافة محدد بالرقم المعرف
router.get("/:id", artsCultureController.getArtsCultureById);

module.exports = router;
