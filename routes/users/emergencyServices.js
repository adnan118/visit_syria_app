const express = require("express");
const router = express.Router();
const emergencyServicesController = require("../../controllers/emergencyServices/emergencyServicesController");
const { uploadEmergencyServiceMediaWithCompression } = require("../../controllers/services/mediaHelper");

// Routes for emergency services
router
  .route("/")
  .post(
    uploadEmergencyServiceMediaWithCompression,
    emergencyServicesController.createEmergencyService
  )
  .get(emergencyServicesController.getAllEmergencyServices);

router
  .route("/:id")
  .get(emergencyServicesController.getEmergencyService)
  .put(
    uploadEmergencyServiceMediaWithCompression,
    emergencyServicesController.updateEmergencyService
  )
  .delete(emergencyServicesController.deleteEmergencyService);

module.exports = router;