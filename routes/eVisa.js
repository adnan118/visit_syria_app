/*
E-Visa Routes (eVisa.js)
-----------------------
Purpose:
- Defines routes for E-Visa applications
- Includes: creating, retrieving, updating, and deleting E-Visa applications
- Authentication required for all operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import E-Visa controller
const eVisaController = require("../controllers/eVisa/eVisaController");

// Import media helper functions for file uploads
const {
  uploadEVisaFilesWithCompression,
} = require("../controllers/services/mediaHelper");

// ✅ E-Visa routes (authentication required for all operations)
// Create new E-Visa application
router.post("/", (req, res, next) => uploadEVisaFilesWithCompression(req, res, next, true), eVisaController.createEVisaApplication);
// Get all E-Visa applications
router.get("/", eVisaController.getAllEVisaApplications);
// Get specific E-Visa application by ID
router.get("/:id", eVisaController.getEVisaApplicationById);
// Update E-Visa application
router.put("/:id", (req, res, next) => uploadEVisaFilesWithCompression(req, res, next, true), eVisaController.updateEVisaApplication);
// Delete E-Visa application
router.delete("/:id", eVisaController.deleteEVisaApplication);

module.exports = router;