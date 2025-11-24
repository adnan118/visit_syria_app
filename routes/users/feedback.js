/*
Public Feedback Routes (feedback.js)
----------------------------------
Purpose:
- Defines public routes for Feedback submission
- Includes: creating Feedback records
- No authentication required for these operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Feedback controller
const feedbackController = require("../../controllers/feedbackController");

// ✅ Public Feedback routes
// Create new Feedback
router.post("/", feedbackController.createFeedback);

module.exports = router;