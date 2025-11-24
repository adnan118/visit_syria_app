// routes/trips.js
// مسارات الرحلات

const express = require("express");
const router = express.Router();
const trips = require("../../controllers/trips/trips");

// إضافة/إزالة من الرحلة
router.post("/:name/:itemType/:itemId/toggle", trips.toggle);

// إضافة/إزالة من الرحلة
router.post("/", trips.toggle);

// تحديث اسم الرحلة
router.put("/name", trips.updateName);

// قائمة بأسماء الرحلات
router.get("/names", trips.listNames);

// الحصول على العناصر داخل رحلة معينة
router.get("/:name", trips.getByName);

// الحصول على حالة إضافة عنصر لرحلة معينة
router.get("/:itemType/:itemId/status", trips.getStatus);

module.exports = router;