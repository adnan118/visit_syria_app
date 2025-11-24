/*
Owner Contact Controller (ownerContactController.js)
--------------------------------------------
Purpose:
- Contains all operations related to owner contact information
- Handles creation, reading, updating, and deletion of owner contact records
- Connects user requests with the OwnerContact model
*/

// Import OwnerContact model
const OwnerContact = require('../models/ownerContactModel');

// ---------------------------------------------------------
// 🔹 Create new Owner Contact record (Admin only)
// ---------------------------------------------------------
exports.createOwnerContact = async (req, res, next) => {
  try {
    const { address_ar, address_en, callNumber, email, chatNumber, socialMediaLinks } = req.body;

    // Validate required fields
    if (!address_ar || !address_en || !callNumber || !email || !chatNumber) {
      const error = new Error('Please provide all required fields: address_ar, address_en, callNumber, email, chatNumber.');
      error.status = 400;
      throw error;
    }

    // Create new record in database
    const newOwnerContact = await OwnerContact.create({
      address_ar,
      address_en,
      callNumber,
      email,
      chatNumber,
      socialMediaLinks: socialMediaLinks || []
    });

    // Create clean result object
    const result = {
      id: newOwnerContact.id,
      address_ar: newOwnerContact.address_ar,
      address_en: newOwnerContact.address_en,
      callNumber: newOwnerContact.callNumber,
      email: newOwnerContact.email,
      chatNumber: newOwnerContact.chatNumber,
      socialMediaLinks: newOwnerContact.socialMediaLinks,
      createdAt: newOwnerContact.createdAt,
      updatedAt: newOwnerContact.updatedAt
    };

    res.status(201).json({
      status: "success",
      message: "✅ Owner Contact record created successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get all Owner Contact records (Public)
// ---------------------------------------------------------
exports.getAllOwnerContacts = async (req, res, next) => {
  try {
    // Get all records
    const ownerContacts = await OwnerContact.findAll({
      order: [['id', 'ASC']]
    });

    // Create clean result objects
    const result = ownerContacts.map(contact => ({
      id: contact.id,
      address_ar: contact.address_ar,
      address_en: contact.address_en,
      callNumber: contact.callNumber,
      email: contact.email,
      chatNumber: contact.chatNumber,
      socialMediaLinks: contact.socialMediaLinks,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }));

    res.status(200).json({
      status: "success",
      message: "✅ All Owner Contact records retrieved successfully.",
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Update Owner Contact record (Admin only)
// ---------------------------------------------------------
exports.updateOwnerContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { address_ar, address_en, callNumber, email, chatNumber, socialMediaLinks } = req.body;

    const ownerContact = await OwnerContact.findByPk(id);
    if (!ownerContact) {
      const error = new Error("Owner Contact record not found.");
      error.status = 404;
      throw error;
    }

    // Prepare update data
    const updateData = {
      address_ar: address_ar || ownerContact.address_ar,
      address_en: address_en || ownerContact.address_en,
      callNumber: callNumber || ownerContact.callNumber,
      email: email || ownerContact.email,
      chatNumber: chatNumber || ownerContact.chatNumber,
      socialMediaLinks: socialMediaLinks || ownerContact.socialMediaLinks
    };

    // Execute update in database
    const updatedOwnerContact = await ownerContact.update(updateData);

    // Create clean result object
    const result = {
      id: updatedOwnerContact.id,
      address_ar: updatedOwnerContact.address_ar,
      address_en: updatedOwnerContact.address_en,
      callNumber: updatedOwnerContact.callNumber,
      email: updatedOwnerContact.email,
      chatNumber: updatedOwnerContact.chatNumber,
      socialMediaLinks: updatedOwnerContact.socialMediaLinks,
      createdAt: updatedOwnerContact.createdAt,
      updatedAt: updatedOwnerContact.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Owner Contact record updated successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Delete Owner Contact record (Admin only)
// ---------------------------------------------------------
exports.deleteOwnerContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the record to delete
    const ownerContact = await OwnerContact.findByPk(id);
    if (!ownerContact) {
      return res.status(404).json({
        status: "failure",
        message: "Owner Contact record not found."
      });
    }

    // Delete the record from database
    await ownerContact.destroy();

    // Send final response
    res.status(200).json({
      status: "success",
      message: "🗑️ Owner Contact record deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};