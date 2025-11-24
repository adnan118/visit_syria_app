// routes/tags.js
// مسارات إدارة الوسوم (Tags)

const express = require("express");
const router = express.Router();
const tags = require("../../controllers/tags/tags");

// إنشاء وسم
router.post("/", tags.create);

// قائمة الوسوم
router.get("/", tags.list);

// جلب وسم (id أو slug)
router.get("/:id", tags.get);

// تحديث وسم
router.put("/:id", tags.update);

// حذف وسم
router.delete("/:id", tags.remove);

module.exports = router;
