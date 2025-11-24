/*
ملف مسارات إدارة العروض (admin/offers.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة العروض للمشرفين فقط
- يشمل: إنشاء عرض، تحديث عرض، حذف عرض
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم العروض
const offersController = require("../../controllers/offers/offers");

// استيراد وسيط JWT
const { authJwt, requireAdmin } = require("../../middlewares/jwt");

// استيراد دالة رفع صور العروض مع الضغط
const {
  uploadOffersImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

// تطبيق وسيط المصادقة على جميع مسارات إدارة العروض
router.use(authJwt());
router.use(requireAdmin());

// ✅ مسارات العروض للمشرفين فقط

// إنشاء عرض جديد (مع رفع صور)
router.post("/", (req, res, next) => uploadOffersImagesWithCompression(req, res, next), offersController.createOffer);

// تحديث عرض (مع رفع صور)
router.put("/:id", (req, res, next) => uploadOffersImagesWithCompression(req, res, next), offersController.updateOffer);

// حذف عرض
router.delete("/:id", offersController.deleteOffer);

module.exports = router;