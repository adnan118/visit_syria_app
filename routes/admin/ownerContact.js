/*
Admin Owner Contact Routes (admin/ownerContact.js)
------------------------------------------
Purpose:
- Defines admin routes for Owner Contact management
- Includes: creating Owner Contact, updating Owner Contact, deleting Owner Contact
- Requires admin authentication for all operations

Used Libraries:
- express: Express framework
*/
// Import express to create routes
const express = require("express");
const router = express.Router();
// Import Owner Contact controller
const ownerContactController = require("../../controllers/ownerContactController");

// ✅ Admin-only Owner Contact routes
// Create new Owner Contact
router.post("/", ownerContactController.createOwnerContact);
// Update Owner Contact
router.put("/:id", ownerContactController.updateOwnerContact);
// Delete Owner Contact
router.delete("/:id", ownerContactController.deleteOwnerContact);

module.exports = router;