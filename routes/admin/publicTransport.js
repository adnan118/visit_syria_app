/*
ملف مسارات إدارة PublicTransport (admin/publicTransport.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة PublicTransport للمشرفين فقط
- يشمل: إنشاء PublicTransport، تحديث PublicTransport، حذف PublicTransport
- يتطلب مصادقة المشرف لجميع العمليات
مكتبات المستخدم:
- express: إطار العمل Express
*/
// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();
// استيراد وحدة تحكم PublicTransport
const publicTransportController = require("../../controllers/PublicTransport/publicTransport");
// استيراد دالة رفع صور PublicTransport مع الضغط
const {
  uploadPublicTransportImageWithCompression,
} = require("../../controllers/services/mediaHelper");
 
// ✅ مسارات PublicTransport للمشرفين فقط
// إنشاء PublicTransport جديد (مع رفع صور)
router.post("/", (req, res, next) => uploadPublicTransportImageWithCompression(req, res, next), publicTransportController.createPublicTransport);
// تحديث PublicTransport (مع رفع صور)
router.put("/:id", (req, res, next) => uploadPublicTransportImageWithCompression(req, res, next), publicTransportController.updatePublicTransport);
// حذف PublicTransport
router.delete("/:id", publicTransportController.deletePublicTransport);
module.exports = router;