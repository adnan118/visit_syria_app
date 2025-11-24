// routes/saves.js
// مسارات الحفظ

const express = require("express");
const router = express.Router();
const saves = require("../../controllers/saves/saves");

// حفظ/إلغاء حفظ
router.post("/:postId/toggle", saves.toggle);

// منشوراتي المحفوظة
router.get("/me", saves.listByMe);

module.exports = router;