const express = require("express");
const router = express.Router();
const emergencyServicesController = require("../../controllers/emergencyServices/emergencyServicesController");
const { uploadEmergencyServiceMediaWithCompression } = require("../../controllers/services/mediaHelper");

// Admin routes for emergency services
// All routes are prefixed with /api/v1/admin/emergency-services

// Create emergency service
router.post(
  "/",
  uploadEmergencyServiceMediaWithCompression,
  emergencyServicesController.createEmergencyService
);

// Update emergency service
router.put(
  "/:id",
  uploadEmergencyServiceMediaWithCompression,
  emergencyServicesController.updateEmergencyService
);

// Delete emergency service
router.delete(
  "/:id",
  emergencyServicesController.deleteEmergencyService
);

module.exports = router;