/*ملف مسارات إدارة المهرجانات والأحداث (admin/festivalsEvents.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة المهرجانات والأحداث للمشرفين فقط
- يشمل: إنشاء مهرجان أو حدث، تحديث مهرجان أو حدث، حذف مهرجان أو حدث
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المهرجانات والأحداث
const festivalsEventsController = require("../../controllers/NewEvents/festivalsEventsController");

// استيراد دالة رفع صور المهرجانات والأحداث مع الضغط
const {
  uploadFestivalsEventsImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

// ✅ مسارات المهرجانات والأحداث للمشرفين فقط

// إنشاء مهرجان أو حدث جديد (مع رفع صور/فيديوهات)
router.post("/", (req, res, next) => uploadFestivalsEventsImagesWithCompression(req, res, next), festivalsEventsController.createFestivalEvent);

// تحديث مهرجان أو حدث (مع رفع صور/فيديوهات)
router.put("/:id", (req, res, next) => uploadFestivalsEventsImagesWithCompression(req, res, next), festivalsEventsController.updateFestivalEvent);

// حذف مهرجان أو حدث
router.delete("/:id", festivalsEventsController.deleteFestivalEvent);

module.exports = router;