/*ملف مسارات المهرجانات والأحداث (user/festivalsEvents.js)
------------------------------------
وظيفة الملف:
- يحدد مسارات المهرجانات والأحداث للمستخدمين
- يشمل: عرض جميع المهرجانات والأحداث، عرض مهرجان أو حدث محدد
- لا يتطلب مصادقة للمستخدم العادي

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المهرجانات والأحداث
const festivalsEventsController = require("../../controllers/NewEvents/festivalsEventsController");

// ✅ مسارات المهرجانات والأحداث للمستخدمين

// عرض جميع المهرجانات والأحداث
router.get("/", festivalsEventsController.getAllFestivalsEvents);

// عرض مهرجان أو حدث محدد
router.get("/:id", festivalsEventsController.getFestivalEventById);

module.exports = router;