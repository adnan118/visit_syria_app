/*
ملف مسارات إدارة المطاعم (admin/restaurants.js)
------------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة المطاعم للمشرفين فقط
- يشمل: إنشاء مطعم، تحديث مطعم، حذف مطعم
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المطاعم
const restaurantsController = require("../../controllers/FoodAndDrinks/restaurantsController");
 
// استيراد دالة رفع صور المطاعم مع الضغط
const {
  uploadRestaurantImagesWithCompression,
} = require("../../controllers/services/mediaHelper");

 

// ✅ مسارات المطاعم للمشرفين فقط

// إنشاء مطعم جديد (مع رفع صور)
router.post("/", (req, res, next) => uploadRestaurantImagesWithCompression(req, res, next), restaurantsController.createRestaurant);

// تحديث مطعم (مع رفع صور)
router.put("/:id", (req, res, next) => uploadRestaurantImagesWithCompression(req, res, next), restaurantsController.updateRestaurant);

// حذف مطعم
router.delete("/:id", restaurantsController.deleteRestaurant);

module.exports = router;