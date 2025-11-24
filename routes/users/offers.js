const express = require("express");
const router = express.Router();

const userOffers = require("./offers");
const adminOffers = require("../admin/offers");
 
// ✅ مسارات العروض
router.use("/offers", userOffers);
router.use("/admin/offers", adminOffers);

module.exports = router;