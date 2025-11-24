// routes/stories.js
const express = require("express");
const router = express.Router();
const { param, validationResult } = require("express-validator");
const stories = require("../../controllers/stories/stories");
const {
  uploadStoryMediaWithCompression,
} = require("../../controllers/services/mediaHelper");

// Middleware للتحقق من صحة ID - استخدام التحقق من الرقم الموجب بدلاً من isMongoId
const validateStoryId = [
  param("id").matches(/^[1-9][0-9]*$/).withMessage("Invalid story ID format"),
];

// Middleware لمعالجة أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    const error = new Error("Validation errors");
    error.status = 400;
    error.errors = errorMsg;
    return next(error);
  }
  next();
};

// Share story (up to 5 items)
router.post(
  "/",
  (req, res, next) => uploadStoryMediaWithCompression(req, res, next, true),
  stories.create
);

// My stories
router.get("/me", stories.listMine);

// Feed
router.get("/feed", stories.feed);

// View story (increment view count)
router.post("/:id/view", validateStoryId, handleValidationErrors, stories.view);

// Delete story
router.delete("/:id", validateStoryId, handleValidationErrors, stories.delete);

module.exports = router;
