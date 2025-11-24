/*
Admin Feedback Routes (admin/feedback.js)
-------------------------------------
Purpose:
- Defines admin routes for Feedback management
- Includes: retrieving all Feedback records, retrieving specific Feedback by ID, deleting Feedback
- Requires admin authentication for all operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Feedback controller
const feedbackController = require("../../controllers/feedbackController");

// ✅ Admin-only Feedback routes
// Get all Feedback records
router.get("/", feedbackController.getAllFeedback);
// Get specific Feedback by ID
router.get("/:id", feedbackController.getFeedbackById);
// Delete Feedback
router.delete("/:id", feedbackController.deleteFeedback);

module.exports = router;