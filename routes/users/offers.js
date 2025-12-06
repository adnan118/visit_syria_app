const express = require("express");
const router = express.Router();

// استيراد وحدة تحكم العروض
const offersController = require("../../controllers/offers/offers");

// ✅ مسارات العروض العامة (وصول للقراءة فقط)
// الحصول على جميع العروض
router.get("/", offersController.getAllOffers);

// الحصول على عرض محدد بالرقم المعرف
router.get("/:id", offersController.getOfferById);

module.exports = router;
