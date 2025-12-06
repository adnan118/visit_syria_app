/*
ملف مسارات الطعام والشراب (FoodAndDrinks.js)
----------------------------------------
وظيفة الملف:
- يحدد جميع مسارات الطعام والشراب
- يشمل: مسارات المطاعم، الكافتيريا، والعروض، والترفيه والإيواء
- يربط بين طلبات المستخدم ووحدات التحكم

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد مسارات المستخدمين
const restaurants = require("./restaurants");
const cafeterias = require("./cafeterias");

// ✅ مسارات المطاعم
router.use("/restaurants", restaurants);

// ✅ مسارات الكافتيريا
router.use("/cafeterias", cafeterias);

module.exports = router;