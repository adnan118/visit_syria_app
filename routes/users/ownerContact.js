/*
Public Owner Contact Routes (ownerContact.js)
------------------------------------------
Purpose:
- Defines public routes for Owner Contact information
- Includes: retrieving all Owner Contact records
- No authentication required for these operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Owner Contact controller
const ownerContactController = require("../../controllers/ownerContactController");

// ✅ Public Owner Contact routes
// Get all Owner Contact records
router.get("/", ownerContactController.getAllOwnerContacts);

module.exports = router;