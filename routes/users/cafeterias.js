/*
ملف مسارات الكافتيريا (cafeterias.js)
------------------------------------
وظيفة الملف:
- يحدد مسارات الكافتيريا للمستخدمين
- يشمل: عرض جميع الكافتيريا، عرض كافتيريا محدد
- لا يتطلب مصادقة للمستخدم العادي

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم الكافتيريا
const cafeteriaController = require("../../controllers/FoodAndDrinks/cafeteriaController");

// ✅ مسارات الكافتيريا للمستخدمين

// عرض جميع الكافتيريا
router.get("/", cafeteriaController.getAllCafeterias);

// عرض كافتيريا محدد
router.get("/:id", cafeteriaController.getCafeteriaById);

module.exports = router;