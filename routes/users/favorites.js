// routes/favorites.js
// مسارات المفضلات

const express = require("express");
const router = express.Router();
const favorites = require("../../controllers/favorites/favorites");

// إضافة/إزالة من المفضلة
router.post("/:itemType/:itemId/toggle", favorites.toggle);

// إنشاء مفضلة جديدة
router.post("/", favorites.toggle);

// قائمة المفضلة الخاصة بالمستخدم
router.get("/me", favorites.listByMe);

// الحصول على حالة المفضلة لعنصر معين
router.get("/:itemType/:itemId/status", favorites.getStatus);

module.exports = router;