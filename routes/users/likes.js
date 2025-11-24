// routes/likes.js
// مسارات الإعجابات

const express = require("express");
const router = express.Router();
const likes = require("../../controllers/likes/likes");

// قلب إعجاب/إلغاء إعجاب
router.post("/:postId/toggle", likes.toggle);

// منشوراتي المُعجب بها
router.get("/me", likes.listByMe);

module.exports = router;