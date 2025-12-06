/*
ملف مسارات إدارة الكافتيريا (admin/cafeterias.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة الكافتيريا للمشرفين فقط
- يشمل: إنشاء كافتيريا، تحديث كافتيريا، حذف كافتيريا
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم الكافتيريا
const cafeteriaController = require("../../controllers/FoodAndDrinks/cafeteriaController");

 
// استيراد دالة رفع صور الكافتيريا مع الضغط
const {
  uploadCafeteriaImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

 
// ✅ مسارات الكافتيريا للمشرفين فقط

// إنشاء كافتيريا جديد (مع رفع صور)
router.post("/", (req, res, next) => uploadCafeteriaImagesWithCompression(req, res, next), cafeteriaController.createCafeteria);

// تحديث كافتيريا (مع رفع صور)
router.put("/:id", (req, res, next) => uploadCafeteriaImagesWithCompression(req, res, next), cafeteriaController.updateCafeteria);

// حذف كافتيريا
router.delete("/:id", cafeteriaController.deleteCafeteria);

module.exports = router;