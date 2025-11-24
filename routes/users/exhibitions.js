/*ملف مسارات المعارض (user/exhibitions.js)
------------------------------------
وظيفة الملف:
- يحدد مسارات المعارض للمستخدمين
- يشمل: عرض جميع المعارض، عرض معرض محدد
- لا يتطلب مصادقة للمستخدم العادي

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المعارض
const exhibitionsController = require("../../controllers/NewEvents/exhibitionsController");

// ✅ مسارات المعارض للمستخدمين

// عرض جميع المعارض
router.get("/", exhibitionsController.getAllExhibitions);

// عرض معرض محدد
router.get("/:id", exhibitionsController.getExhibitionById);

module.exports = router;