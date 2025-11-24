/*ملف مسارات الأحداث الجديدة (NewEvents.js)
------------------------------------
وظيفة الملف:
- يحدد مسارات الأحداث الجديدة للمستخدمين
- يشمل: مسارات المهرجانات والأحداث، المعارض
- يربط بين طلبات المستخدم ووحدات التحكم

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد مسارات المستخدمين
const festivalsEvents = require("./festivalsEvents");
const exhibitions = require("./exhibitions");

// ✅ مسارات المهرجانات والأحداث
router.use("/festivals-events", festivalsEvents);

// ✅ مسارات المعارض
router.use("/exhibitions", exhibitions);

module.exports = router;