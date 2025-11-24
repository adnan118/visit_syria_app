/*
Visa Type Controller (visaTypeController.js)
------------------------------------------
Purpose:
- Contains all operations related to visa types
- Handles creation, reading, updating, and deletion of visa type records
- Connects user requests with the VisaType model
*/

// Import models with associations
const { VisaType } = require('../models');
const { Sequelize } = require('sequelize');

// ---------------------------------------------------------
// 🔹 Create new Visa Type record (Admin only)
// ---------------------------------------------------------
exports.createVisaType = async (req, res, next) => {
  try {
    const { purpose_of_visit_en, purpose_of_visit_ar, fee_amount } = req.body;

    // Validate required fields
    if (!purpose_of_visit_en || !purpose_of_visit_ar || fee_amount === undefined) {
      const error = new Error('Please provide all required fields: purpose_of_visit_en, purpose_of_visit_ar, fee_amount.');
      error.status = 400;
      throw error;
    }

    // Validate fee_amount is a number
    if (isNaN(fee_amount) || parseFloat(fee_amount) < 0) {
      const error = new Error('Fee amount must be a valid positive number.');
      error.status = 400;
      throw error;
    }

    // Check if a visa type with this English purpose already exists
    const existingVisaType = await VisaType.findOne({
      where: { purpose_of_visit_en }
    });

    if (existingVisaType) {
      const error = new Error('A visa type with this English purpose of visit already exists.');
      error.status = 400;
      throw error;
    }

    // Create new record in database
    const newVisaType = await VisaType.create({
      purpose_of_visit_en,
      purpose_of_visit_ar,
      fee_amount: parseFloat(fee_amount)
    });

    // Create clean result object
    const result = {
      id: newVisaType.id,
      purpose_of_visit_en: newVisaType.purpose_of_visit_en,
      purpose_of_visit_ar: newVisaType.purpose_of_visit_ar,
      fee_amount: newVisaType.fee_amount,
      createdAt: newVisaType.createdAt,
      updatedAt: newVisaType.updatedAt
    };

    res.status(201).json({
      status: "success",
      message: "✅ Visa Type record created successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get all Visa Type records (Public)
// ---------------------------------------------------------
exports.getAllVisaTypes = async (req, res, next) => {
  try {
    // Get all records
    const visaTypes = await VisaType.findAll({
      order: [['id', 'ASC']]
    });

    // Create clean result objects
    const result = visaTypes.map(visaType => ({
      id: visaType.id,
      purpose_of_visit_en: visaType.purpose_of_visit_en,
      purpose_of_visit_ar: visaType.purpose_of_visit_ar,
      fee_amount: visaType.fee_amount,
      createdAt: visaType.createdAt,
      updatedAt: visaType.updatedAt
    }));

    res.status(200).json({
      status: "success",
      message: "✅ All Visa Type records retrieved successfully.",
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get specific Visa Type record by ID (Public)
// ---------------------------------------------------------
exports.getVisaTypeById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const visaType = await VisaType.findByPk(id);

    if (!visaType) {
      const error = new Error('Visa Type record not found.');
      error.status = 404;
      throw error;
    }

    // Create clean result object
    const result = {
      id: visaType.id,
      purpose_of_visit_en: visaType.purpose_of_visit_en,
      purpose_of_visit_ar: visaType.purpose_of_visit_ar,
      fee_amount: visaType.fee_amount,
      createdAt: visaType.createdAt,
      updatedAt: visaType.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Visa Type record found.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Update Visa Type record (Admin only)
// ---------------------------------------------------------
exports.updateVisaType = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purpose_of_visit_en, purpose_of_visit_ar, fee_amount } = req.body;

    const visaType = await VisaType.findByPk(id);
    if (!visaType) {
      const error = new Error("Visa Type record not found.");
      error.status = 404;
      throw error;
    }

    // Prepare update data
    const updateData = {};

    // Only update purpose_of_visit_en if provided and different
    if (purpose_of_visit_en && purpose_of_visit_en !== visaType.purpose_of_visit_en) {
      // Check if another visa type with this English purpose already exists
      const existingVisaType = await VisaType.findOne({
        where: { 
          purpose_of_visit_en,
          id: { [Sequelize.Op.ne]: id } // Not equal to current id
        }
      });

      if (existingVisaType) {
        const error = new Error('A visa type with this English purpose of visit already exists.');
        error.status = 400;
        throw error;
      }
      
      updateData.purpose_of_visit_en = purpose_of_visit_en;
    }

    // Only update purpose_of_visit_ar if provided
    if (purpose_of_visit_ar) {
      updateData.purpose_of_visit_ar = purpose_of_visit_ar;
    }

    // Only update fee_amount if provided
    if (fee_amount !== undefined) {
      // Validate fee_amount is a number
      if (isNaN(fee_amount) || parseFloat(fee_amount) < 0) {
        const error = new Error('Fee amount must be a valid positive number.');
        error.status = 400;
        throw error;
      }
      updateData.fee_amount = parseFloat(fee_amount);
    }

    // If no fields to update, return current data
    if (Object.keys(updateData).length === 0) {
      const result = {
        id: visaType.id,
        purpose_of_visit_en: visaType.purpose_of_visit_en,
        purpose_of_visit_ar: visaType.purpose_of_visit_ar,
        fee_amount: visaType.fee_amount,
        createdAt: visaType.createdAt,
        updatedAt: visaType.updatedAt
      };

      return res.status(200).json({
        status: "success",
        message: "✅ No changes to update.",
        data: result
      });
    }

    // Execute update in database
    const updatedVisaType = await visaType.update(updateData);

    // Create clean result object
    const result = {
      id: updatedVisaType.id,
      purpose_of_visit_en: updatedVisaType.purpose_of_visit_en,
      purpose_of_visit_ar: updatedVisaType.purpose_of_visit_ar,
      fee_amount: updatedVisaType.fee_amount,
      createdAt: updatedVisaType.createdAt,
      updatedAt: updatedVisaType.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Visa Type record updated successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Delete Visa Type record (Admin only)
// ---------------------------------------------------------
exports.deleteVisaType = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the record to delete
    const visaType = await VisaType.findByPk(id);
    if (!visaType) {
      return res.status(404).json({
        status: "failure",
        message: "Visa Type record not found."
      });
    }

    // Delete the record from database
    await visaType.destroy();

    // Send final response
    res.status(200).json({
      status: "success",
      message: "🗑️ Visa Type record deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};