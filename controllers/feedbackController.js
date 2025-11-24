/*
Feedback Controller (feedbackController.js)
------------------------------------------
Purpose:
- Contains all operations related to user feedback
- Handles creation, reading, and deletion of feedback records
- Connects user requests with the Feedback model
*/

// Import Feedback model
const Feedback = require('../models/feedbackModel');

// ---------------------------------------------------------
// 🔹 Create new Feedback record (Public)
// ---------------------------------------------------------
exports.createFeedback = async (req, res, next) => {
  try {
    const { firstName, lastName, email, country, feedback } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !country || !feedback) {
      const error = new Error('Please provide all required fields: firstName, lastName, email, country, feedback.');
      error.status = 400;
      throw error;
    }

    // Create new record in database
    const newFeedback = await Feedback.create({
      firstName,
      lastName,
      email,
      country,
      feedback
    });

    // Create clean result object
    const result = {
      id: newFeedback.id,
      firstName: newFeedback.firstName,
      lastName: newFeedback.lastName,
      email: newFeedback.email,
      country: newFeedback.country,
      feedback: newFeedback.feedback,
      createdAt: newFeedback.createdAt,
      updatedAt: newFeedback.updatedAt
    };

    res.status(201).json({
      status: "success",
      message: "✅ Feedback submitted successfully.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get all Feedback records (Admin only)
// ---------------------------------------------------------
exports.getAllFeedback = async (req, res, next) => {
  try {
    // Get all records
    const feedbackRecords = await Feedback.findAll({
      order: [['id', 'ASC']]
    });

    // Create clean result objects
    const result = feedbackRecords.map(feedback => ({
      id: feedback.id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      country: feedback.country,
      feedback: feedback.feedback,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt
    }));

    res.status(200).json({
      status: "success",
      message: "✅ All Feedback records retrieved successfully.",
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get specific Feedback record by ID (Admin only)
// ---------------------------------------------------------
exports.getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findByPk(id);

    if (!feedback) {
      const error = new Error('Feedback record not found.');
      error.status = 404;
      throw error;
    }

    // Create clean result object
    const result = {
      id: feedback.id,
      firstName: feedback.firstName,
      lastName: feedback.lastName,
      email: feedback.email,
      country: feedback.country,
      feedback: feedback.feedback,
      createdAt: feedback.createdAt,
      updatedAt: feedback.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Feedback record found.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Delete Feedback record (Admin only)
// ---------------------------------------------------------
exports.deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the record to delete
    const feedback = await Feedback.findByPk(id);
    if (!feedback) {
      return res.status(404).json({
        status: "failure",
        message: "Feedback record not found."
      });
    }

    // Delete the record from database
    await feedback.destroy();

    // Send final response
    res.status(200).json({
      status: "success",
      message: "🗑️ Feedback record deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};