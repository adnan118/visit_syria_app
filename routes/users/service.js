// routes/services.js
// مسارات إدارة الخدمات (Services)

const express = require("express");
const router = express.Router();
const services = require("../../controllers/service/servicesController");

router.post("/", services.create);
router.get("/", services.list);
router.get("/:id", services.get);
router.put("/:id", services.update);
router.delete("/:id", services.remove);

module.exports = router;
