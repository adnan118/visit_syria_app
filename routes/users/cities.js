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
const citiesController = require("../../controllers/cities/citiesController");

 

// الوصول للقراءة للعامة (لا تتطلب مصادقة)

router.get("/cities", cities.getAllCities);

router.get("/cities/:id", cities.getCityById);

module.exports = router;