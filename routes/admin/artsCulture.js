/*
ملف مسارات إدارة الفنون والثقافة (admin/artsCulture.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة الفنون والثقافة للمشرفين فقط
- يشمل: إنشاء سجل، تحديث سجل، حذف سجل
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم الفنون والثقافة
const artsCultureController = require("../../controllers/ExploreSyria/artsCultureController");

// استيراد وسيط JWT
const { authJwt, requireAdmin } = require("../../middlewares/jwt");

// استيراد دالة رفع صور الفنون والثقافة مع الضغط
const {
  uploadArtsCultureImageWithCompression,
} = require("../../controllers/services/mediaHelper");

// تطبيق وسيط المصادقة على جميع مسارات إدارة الفنون والثقافة
// router.use(authJwt()); // This is already applied in AdminRoutes.js
router.use(requireAdmin());

// ✅ مسارات الفنون والثقافة للمشرفين فقط

// إنشاء سجل جديد (مع رفع صورة)
router.post("/", (req, res, next) => uploadArtsCultureImageWithCompression(req, res, next), artsCultureController.createArtsCulture);

// تحديث سجل (مع رفع صورة)
router.put("/:id", (req, res, next) => uploadArtsCultureImageWithCompression(req, res, next), artsCultureController.updateArtsCulture);

// حذف سجل
router.delete("/:id", artsCultureController.deleteArtsCulture);

module.exports = router;
