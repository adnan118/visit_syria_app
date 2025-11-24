/*ملف مسارات إدارة المعارض (admin/exhibitions.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة المعارض للمشرفين فقط
- يشمل: إنشاء معرض، تحديث معرض، حذف معرض
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المعارض
const exhibitionsController = require("../../controllers/NewEvents/exhibitionsController");

// استيراد دالة رفع صور المعارض مع الضغط
const {
  uploadExhibitionsImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

// ✅ مسارات المعارض للمشرفين فقط

// إنشاء معرض جديد (مع رفع صور/فيديوهات)
router.post("/", (req, res, next) => uploadExhibitionsImagesWithCompression(req, res, next), exhibitionsController.createExhibition);

// تحديث معرض (مع رفع صور/فيديوهات)
router.put("/:id", (req, res, next) => uploadExhibitionsImagesWithCompression(req, res, next), exhibitionsController.updateExhibition);

// حذف معرض
router.delete("/:id", exhibitionsController.deleteExhibition);

module.exports = router;