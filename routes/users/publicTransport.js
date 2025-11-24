/*
ملف مسارات PublicTransport (publicTransport.js)
----------------------------------------
وظيفة الملف:
- يحدد جميع مسارات PublicTransport
- يشمل: مسارات PublicTransport العامة
- يربط بين طلبات المستخدم ووحدات التحكم
مكتبات المستخدم:
- express: إطار العمل Express
*/
// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();
// استيراد وحدة تحكم PublicTransport
const publicTransportController = require("../../controllers/PublicTransport/publicTransport");
// ✅ مسارات PublicTransport العامة (وصول للقراءة فقط)
// الحصول على جميع سجلات PublicTransport
router.get("/", publicTransportController.getAllPublicTransports);
// الحصول على سجل PublicTransport محدد بالرقم المعرف
router.get("/:id", publicTransportController.getPublicTransportById);
module.exports = router;