// routes/posts.js
const express = require("express");
const router = express.Router();
const posts = require("../../controllers/posts/posts");
const {
  uploadPostMediaWithCompression,
  handleUploadError,
} = require("../../controllers/services/mediaHelper");

// Create post (media handled at route)
router.post(
  "/",
  (req, res, next) => uploadPostMediaWithCompression(req, res, next, true),
  posts.create
);

// Top posts - place BEFORE dynamic :id
router.get("/best/top", posts.top);

// List posts (public) hides soft-deleted and inactive authors
router.get("/", posts.list);

// My posts (includes my hidden ones)
router.get("/me", posts.listMine);

// جلب المنشورات بناءً على اهتمامات المستخدم
router.get("/me/interests", posts.getPostsByUserInterests);

// NOTE: Moved to dedicated routes
// - GET    /api/v1/saves/me   -> routes/saves.js
// - GET    /api/v1/likes/me   -> routes/likes.js
// - POST   /api/v1/likes/:postId/toggle -> routes/likes.js
// - POST   /api/v1/saves/:postId/toggle -> routes/saves.js

// Comments
router.post("/:id/comments", posts.addComment);

// Share (increments sharesCount)
router.post("/:id/share", posts.share);

// إخفاء/إظهار بوست (Soft Hide/Unhide)
router.post("/:id/toggle-hidden", posts.toggleHidden);
// Update post (with or without media)
router.put(
  "/:id",
  (req, res, next) => uploadPostMediaWithCompression(req, res, next, true),
  posts.update
);

// Get one (+ increments views atomically)
router.get("/:id", posts.get);

// Delete a post
router.delete("/:id", posts.remove);
// Get post as HTML page with Open Graph metadata for social sharing (BEFORE dynamic :id)
// This route should be public for social media crawlers
router.get("/:id/og", (req, res, next) => {
  // Temporarily bypass auth for this specific route
  req.auth = req.auth || {}; // Create empty auth object if not exists
  next();
}, posts.getOpenGraphPage);
module.exports = router;