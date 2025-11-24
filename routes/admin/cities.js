/*
ملف مسارات إدارة المدن (admin/cities.js)
-------------------------------------
وظيفة الملف:
- يحدد مسارات إدارة المدن للمشرفين فقط
- يشمل: إنشاء مدينة، تحديث مدينة، حذف مدينة
- يتطلب مصادقة المشرف لجميع العمليات

مكتبات المستخدم:
- express: إطار العمل Express
*/

// استيراد express لإنشاء موجهات التوجيه
const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم المدن
const citiesController = require("../../controllers/ExploreSyria/citiesController");

// استيراد وسيط JWT
const { authJwt, requireAdmin } = require("../../middlewares/jwt");

// تطبيق وسيط المصادقة على جميع مسارات إدارة المدن
router.use(authJwt());
router.use(requireAdmin());

// ✅ مسارات المدن للمشرفين فقط

// إنشاء مدينة جديدة
router.post("/", citiesController.createCity);

// تحديث مدينة
router.put("/:id", citiesController.updateCity);

// حذف مدينة
router.delete("/:id", citiesController.deleteCity);

module.exports = router;