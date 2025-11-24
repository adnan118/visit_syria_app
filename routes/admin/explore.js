/*
ملف مسارات إدارة Explore (admin/explore.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة Explore للمشرفين فقط
- يشمل: إنشاء Explore، تحديث Explore، حذف Explore
- يتطلب مصادقة المشرف لجميع العمليات
مكتبات المستخدم:
- express: إطار العمل Express
*/
// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();
// استيراد وحدة تحكم Explore
const exploreController = require("../../controllers/Explore/explore");
// استيراد دالة رفع صور Explore مع الضغط
const {
  uploadExploreImageWithCompression,
} = require("../../controllers/services/mediaHelper");
// ✅ مسارات Explore للمشرفين فقط
// إنشاء Explore جديد (مع رفع صور)
router.post("/", (req, res, next) => uploadExploreImageWithCompression(req, res, next), exploreController.createExplore);
// تحديث Explore (مع رفع صور)
router.put("/:id", (req, res, next) => uploadExploreImageWithCompression(req, res, next), exploreController.updateExplore);
// حذف Explore
router.delete("/:id", exploreController.deleteExplore);
module.exports = router;