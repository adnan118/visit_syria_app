/*
ملف مسارات المطاعم (restaurants.js)
-------------------------------
وظيفة الملف:
- يحدد مسارات المطاعم للوصول العام
- يشمل: الحصول على جميع المطاعم، الحصول على مطعم محدد
- الوصول للقراءة فقط للعامة

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المطاعم
const restaurantsController = require("../../controllers/FoodAndDrinks/restaurantsController");

// ✅ مسارات المطاعم العامة (وصول للقراءة فقط)
// الحصول على جميع المطاعم
router.get("/", restaurantsController.getAllRestaurants);

// الحصول على مطعم محدد بالرقم المعرف
router.get("/:id", restaurantsController.getRestaurantById);

module.exports = router;