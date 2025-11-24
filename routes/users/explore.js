/*
ملف مسارات Explore (explore.js)
----------------------------------------
وظيفة الملف:
- يحدد جميع مسارات Explore
- يشمل: مسارات Explore العامة
- يربط بين طلبات المستخدم ووحدات التحكم
مكتبات المستخدم:
- express: إطار العمل Express
*/
// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();
// استيراد وحدة تحكم Explore
const exploreController = require("../../controllers/Explore/explore");
// ✅ مسارات Explore العامة (وصول للقراءة فقط)
// الحصول على جميع سجلات Explore
router.get("/", exploreController.getAllExplores);
// الحصول على سجل Explore محدد بالرقم المعرف
router.get("/:id", exploreController.getExploreById);
module.exports = router;