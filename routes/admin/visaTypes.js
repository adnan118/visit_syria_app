/*
Admin Visa Types Routes (admin/visaTypes.js)
-------------------------------------
Purpose:
- Defines admin routes for Visa Types management
- Includes: creating Visa Types, updating Visa Types, deleting Visa Types
- Requires admin authentication for all operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Visa Types controller
const visaTypeController = require("../../controllers/visaTypeController");

// ✅ Admin-only Visa Types routes
// Create new Visa Type
router.post("/", visaTypeController.createVisaType);
// Update Visa Type
router.put("/:id", visaTypeController.updateVisaType);
// Delete Visa Type
router.delete("/:id", visaTypeController.deleteVisaType);

module.exports = router;