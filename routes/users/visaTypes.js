/*
Public Visa Types Routes (visaTypes.js)
----------------------------------
Purpose:
- Defines public routes for Visa Types information
- Includes: retrieving all Visa Types records, retrieving specific Visa Type by ID
- No authentication required for these operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Visa Types controller
const visaTypeController = require("../../controllers/visaTypeController");

// ✅ Public Visa Types routes
// Get all Visa Types records
router.get("/", visaTypeController.getAllVisaTypes);
// Get specific Visa Type by ID
router.get("/:id", visaTypeController.getVisaTypeById);

module.exports = router;