const { Post, Tag, Service, Comment, Like, Save, User } = require("../../models");
const { deleteMultipleFiles } = require("../services/mediaHelper");
const sequelize = require("../../models/sequelize");

// دالة آمنة لحذف الملفات
const safeDeleteFiles = async (fileIdentifiers = []) => {
  try {
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0)
      return null;
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    return await deleteMultipleFiles(fileIdentifiers, "posts");
  } catch (e) {
    console.error("❌ خطأ في حذف الملفات:", e);
    return null;
  }
};

// Helper: build media array from req.dbFiles
function buildPostMedia(req) {
  const media = [];
  if (req.dbFiles?.images?.length) {
    for (const file of req.dbFiles.images) media.push({ type: "image", file });
  }
  if (req.dbFiles?.video?.length) {
    media.push({ type: "video", file: req.dbFiles.video[0] });
  }
  return media;
}

// Helper: normalize array input coming from either array or comma-separated string
function toIdArray(val) {
  if (Array.isArray(val)) return val.filter(Boolean);
  if (val == null) return undefined;
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

exports.create = async (req, res, next) => {
  // Start a transaction for database operations
  const transaction = await sequelize.transaction();
  let uploadedFiles = [];
  
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { title, content, tags, services } = req.body;

    const media = buildPostMedia(req);
    
    // Store uploaded files for potential cleanup
    if (req.dbFiles) {
      if (req.dbFiles.images) uploadedFiles.push(...req.dbFiles.images);
      if (req.dbFiles.video) uploadedFiles.push(...req.dbFiles.video);
    }

    // Validate tags if provided
    let validTagIds = [];
    if (tags !== undefined) {
      // Handle tags as comma-separated string or array
      let tagIds = [];
      if (typeof tags === 'string') {
        tagIds = tags.split(',').map(tag => parseInt(tag.trim())).filter(tag => !isNaN(tag));
      } else if (Array.isArray(tags)) {
        tagIds = tags.map(tag => parseInt(tag)).filter(tag => !isNaN(tag));
      }
      
      // Check if all tags exist
      if (tagIds.length > 0) {
        const { Tag } = require('../../models');
        const existingTags = await Tag.findAll({
          where: {
            id: tagIds
          },
          attributes: ['id']
        });
        
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = tagIds.filter(id => !existingTagIds.includes(id));
        
        if (missingTagIds.length > 0) {
          const error = new Error(`The following tags do not exist: ${missingTagIds.join(', ')}`);
          error.status = 400;
          throw error;
        }
        
        validTagIds = existingTagIds.filter(id => tagIds.includes(id));
      }
    }
    
    // Validate services if provided
    let validServiceIds = [];
    if (services !== undefined) {
      // Handle services as comma-separated string or array
      let serviceIds = [];
      if (typeof services === 'string') {
        serviceIds = services.split(',').map(service => parseInt(service.trim())).filter(service => !isNaN(service));
      } else if (Array.isArray(services)) {
        serviceIds = services.map(service => parseInt(service)).filter(service => !isNaN(service));
      }
      
      // Check if all services exist
      if (serviceIds.length > 0) {
        const { Service } = require('../../models');
        const existingServices = await Service.findAll({
          where: {
            id: serviceIds
          },
          attributes: ['id']
        });
        
        const existingServiceIds = existingServices.map(service => service.id);
        const missingServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id));
        
        if (missingServiceIds.length > 0) {
          const error = new Error(`The following services do not exist: ${missingServiceIds.join(', ')}`);
          error.status = 400;
          throw error;
        }
        
        validServiceIds = existingServiceIds.filter(id => serviceIds.includes(id));
      }
    }

    // Prepare post data
    const postData = {
      userId: userId,
      title,
      content,
      media: JSON.stringify(media), // Stringify media to store as JSON string
      status: "pending"
    };

    // Add tags and services if provided
    if (validTagIds.length > 0) {
      postData.tags = validTagIds;
    } else {
      postData.tags = [];
    }
    
    if (validServiceIds.length > 0) {
      postData.services = validServiceIds;
    } else {
      postData.services = [];
    }

    const post = await Post.create(postData, { transaction });
    
    // Commit the transaction if everything is successful
    await transaction.commit();
    
    // Reload the post to get the proper format
    const fullPost = await Post.findByPk(post.id, {
      include: [
        { model: User, as: 'user', attributes: ['firstName', 'lastName', 'username', 'image'] }
      ]
    });
    
    // Format response to match desired structure
    const postJson = fullPost.toJSON();
    const formattedResponse = {
      _id: postJson.id,
      author: {
        _id: postJson.user.id,
        firstName: postJson.user.firstName,
        lastName: postJson.user.lastName,
        username: postJson.user.username,
        image: postJson.user.image,
        isActive: postJson.user.isActive,
        imageUrl: `/public/uploads/images/users/${postJson.user.image}`,
        id: postJson.user.id
      },
      title: postJson.title,
      content: postJson.content,
      media: postJson.media ? (typeof postJson.media === 'string' ? JSON.parse(postJson.media) : postJson.media) : [],
      tags: postJson.tags ? (typeof postJson.tags === 'string' ? JSON.parse(postJson.tags) : postJson.tags) : [],
      services: postJson.services ? (typeof postJson.services === 'string' ? JSON.parse(postJson.services) : postJson.services) : [],
      likesCount: postJson.likesCount,
      commentsCount: postJson.commentsCount,
      sharesCount: postJson.sharesCount,
      viewsCount: postJson.viewsCount,
      isDeleted: postJson.isDeleted,
      status: postJson.status,
      rejectionReason: postJson.rejectionReason,
      createdAt: postJson.createdAt,
      updatedAt: postJson.updatedAt,
      id: postJson.id
    };

    res.status(201).json({ status: "success", data: formattedResponse });
  } catch (e) {
    // Only try to rollback if the transaction is still active
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }
    
    // Clean up uploaded files if any were uploaded
    if (uploadedFiles.length > 0) {
      try {
        await deleteMultipleFiles(uploadedFiles, "posts");
        console.log("Cleaned up uploaded files due to post creation failure");
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded files:", cleanupError);
      }
    }
    
    next(e);
  }
};

exports.list = async (req, res, next) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const { tags, services, q } = req.query;
    const offset = (page - 1) * limit;

    // Build where clause
    const where = { 
      isDeleted: false, 
      status: "approved" 
    };

    // Support text search in title and content
    if (q) {
      where[sequelize.Op.or] = [
        { title: { [sequelize.Op.like]: `%${q}%` } },
        { content: { [sequelize.Op.like]: `%${q}%` } }
      ];
    }

    const { rows: items, count: total } = await Post.findAndCountAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive'],
          where: { isActive: true },
          required: true
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Format the response to match the desired structure
    const formattedItems = items.map(item => {
      const itemJson = item.toJSON();
      return {
        _id: itemJson.id,
        author: {
          _id: itemJson.user.id,
          firstName: itemJson.user.firstName,
          lastName: itemJson.user.lastName,
          username: itemJson.user.username,
          image: itemJson.user.image,
          isActive: itemJson.user.isActive,
          imageUrl: `/public/uploads/images/users/${itemJson.user.image}`,
          id: itemJson.user.id
        },
        title: itemJson.title,
        content: itemJson.content,
        media: itemJson.media ? (typeof itemJson.media === 'string' ? JSON.parse(itemJson.media) : itemJson.media) : [],
        tags: itemJson.tags ? (typeof itemJson.tags === 'string' ? JSON.parse(itemJson.tags) : itemJson.tags) : [],
        services: itemJson.services ? (typeof itemJson.services === 'string' ? JSON.parse(itemJson.services) : itemJson.services) : [],
        likesCount: itemJson.likesCount,
        commentsCount: itemJson.commentsCount,
        sharesCount: itemJson.sharesCount,
        viewsCount: itemJson.viewsCount,
        isDeleted: itemJson.isDeleted,
        status: itemJson.status,
        rejectionReason: itemJson.rejectionReason,
        createdAt: itemJson.createdAt,
        updatedAt: itemJson.updatedAt,
        id: itemJson.id
      };
    });

    res.json({
      status: "success",
      data: formattedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        pageSize: limit,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // First get the post to increment views
    const post = await Post.findByPk(id);
    if (!post) {
      return res.status(404).json({ status: "error", message: "Not found" });
    }
    
    // Hide if author is inactive or post is soft-deleted or not approved
    if (post.isDeleted || post.status !== "approved") {
      // Allow owner or admin to see their own posts even if not approved
      const userId = req.auth?.userId;
      const isAdmin = Boolean(req.auth?.isAdmin);
      const isOwner = post.userId === userId;
      
      if (!isOwner && !isAdmin) {
        return res.status(404).json({ status: "error", message: "Not found" });
      }
    }
    
    // Increment views count
    await post.increment('viewsCount');
    
    // Get the full post with associations
    const fullPost = await Post.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ]
    });
    
    // Get comments with pagination
    const commentsPage = Number(req.query.commentsPage || 1);
    const commentsLimit = 25;
    const commentsOffset = (commentsPage - 1) * commentsLimit;

    const { rows: comments, count: totalComments } = await Comment.findAndCountAll({
      where: { postId: id },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: commentsLimit,
      offset: commentsOffset
    });

    // Prepare response data in the desired format
    const postJson = fullPost.toJSON();
    const responseData = {
      _id: postJson.id,
      author: {
        _id: postJson.user.id,
        firstName: postJson.user.firstName,
        lastName: postJson.user.lastName,
        username: postJson.user.username,
        image: postJson.user.image,
        isActive: postJson.user.isActive,
        imageUrl: `/public/uploads/images/users/${postJson.user.image}`,
        id: postJson.user.id
      },
      title: postJson.title,
      content: postJson.content,
      media: postJson.media ? (typeof postJson.media === 'string' ? JSON.parse(postJson.media) : postJson.media) : [],
      tags: postJson.tags ? (typeof postJson.tags === 'string' ? JSON.parse(postJson.tags) : postJson.tags) : [],
      services: postJson.services ? (typeof postJson.services === 'string' ? JSON.parse(postJson.services) : postJson.services) : [],
      likesCount: postJson.likesCount,
      commentsCount: postJson.commentsCount,
      sharesCount: postJson.sharesCount,
      viewsCount: postJson.viewsCount,
      isDeleted: postJson.isDeleted,
      status: postJson.status,
      rejectionReason: postJson.rejectionReason,
      createdAt: postJson.createdAt,
      updatedAt: postJson.updatedAt,
      id: postJson.id,
      comments: {
        data: comments,
        pagination: {
          currentPage: commentsPage,
          totalPages: Math.ceil(totalComments / commentsLimit),
          totalComments: totalComments,
          hasNext: commentsPage * commentsLimit < totalComments,
          hasPrev: commentsPage > 1,
          pageSize: commentsLimit,
        },
      },
    };

    res.json({ status: "success", data: responseData });
  } catch (e) {
    next(e);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    const { rows: items, count: total } = await Post.findAndCountAll({
      where: { userId: userId },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });

    // Format the response to match the desired structure
    const formattedItems = items.map(item => {
      const itemJson = item.toJSON();
      return {
        ...itemJson,
        _id: itemJson.id,
        author: {
          _id: itemJson.user.id,
          firstName: itemJson.user.firstName,
          lastName: itemJson.user.lastName,
          username: itemJson.user.username,
          image: itemJson.user.image,
          isActive: itemJson.user.isActive,
          imageUrl: `/public/uploads/images/users/${itemJson.user.image}`,
          id: itemJson.user.id
        },
        tags: itemJson.tags || [],
        services: itemJson.services || [],
        id: itemJson.id
      };
    });

    res.json({
      status: "success",
      data: formattedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        pageSize: limit,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.addComment = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { id } = req.params;
    const { content, parent = null } = req.body;
    
    // Check if post exists
    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    
    // Create comment
    const cm = await Comment.create({
      postId: id,
      userId: userId,
      content,
      parentId: parent
    });
    
    // Increment comments count on post
    await post.increment('commentsCount');
    
    // Load comment with user data
    const fullComment = await Comment.findByPk(cm.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ]
    });
    
    res.status(201).json({ status: "success", data: fullComment });
  } catch (e) {
    next(e);
  }
};

exports.top = async (req, res, next) => {
  try {
    const { metric = "views", period = "day" } = req.query; // day|week|month|year|all
    const { Op } = require('sequelize'); // Import Op directly
    
    // Map metric to database field
    const metricMap = {
      views: "viewsCount",
      likes: "likesCount",
      comments: "commentsCount",
      share: "sharesCount",
    };
    
    const field = metricMap[metric] || metricMap.views;
    
    // Calculate date range
    const now = new Date();
    let where = { 
      isDeleted: false, 
      status: "approved" 
    };
    
    if (period !== "all") {
      const fromDate = new Date(now);
      if (period === "day") fromDate.setDate(fromDate.getDate() - 1);
      else if (period === "week") fromDate.setDate(fromDate.getDate() - 7);
      else if (period === "month") fromDate.setMonth(fromDate.getMonth() - 1);
      else if (period === "year") fromDate.setFullYear(fromDate.getFullYear() - 1);
      
      where.createdAt = { [Op.gte]: fromDate };
    }

    // Get top posts
    const posts = await Post.findAll({
      where,
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive'],
          where: { isActive: true },
          required: true
        }
      ],
      order: [[field, 'DESC']],
      limit: 10
    });
    
    // Format posts to match desired structure
    const formattedPosts = posts.map(post => {
      const postJson = post.toJSON();
      return {
        _id: postJson.id,
        author: {
          _id: postJson.user.id,
          firstName: postJson.user.firstName,
          lastName: postJson.user.lastName,
          username: postJson.user.username,
          image: postJson.user.image,
          isActive: postJson.user.isActive,
          imageUrl: `/public/uploads/images/users/${postJson.user.image}`,
          id: postJson.user.id
        },
        title: postJson.title,
        content: postJson.content,
        media: postJson.media ? (typeof postJson.media === 'string' ? JSON.parse(postJson.media) : postJson.media) : [],
        tags: postJson.tags || [],
        services: postJson.services || [],
        likesCount: postJson.likesCount,
        commentsCount: postJson.commentsCount,
        sharesCount: postJson.sharesCount,
        viewsCount: postJson.viewsCount,
        isDeleted: postJson.isDeleted,
        status: postJson.status,
        rejectionReason: postJson.rejectionReason,
        createdAt: postJson.createdAt,
        updatedAt: postJson.updatedAt,
        id: postJson.id
      };
    });
    
    const top3 = formattedPosts.slice(0, 3);

    res.json({ status: "success", data: { top3, list: formattedPosts } });
  } catch (e) {
    next(e);
  }
};

exports.update = async (req, res, next) => {
  // Start a database transaction for consistency
  const transaction = await sequelize.transaction();
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { id } = req.params;

    const post = await Post.findByPk(id, { transaction });

    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }

    // allow owner or admin
    const isAdmin = Boolean(req.auth?.isAdmin);
    const isOwner = post.userId === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // Prevent updating rejected posts unless user is admin
    if (post.status === "rejected" && !isAdmin) {
      return res.status(403).json({ 
        status: "error", 
        message: "Cannot update a rejected post. Please contact admin." 
      });
    }

    const { title, content } = req.body;

    const uploads = buildPostMedia(req);
    // Always replace media when new media is uploaded (no need for replaceMedia flag)
    const hasNewMedia = uploads.length > 0;
    
    console.log("=== Post Update Debug Info ===");
    console.log("hasNewMedia:", hasNewMedia);
    console.log("uploads:", JSON.stringify(uploads, null, 2));
    console.log("post.media:", post.media);

    // Handle both cases: media as object (new format) or string (old format)
    let newMedia;
    let oldMedia = []; // Store old media for potential deletion
    
    if (typeof post.media === 'string') {
      newMedia = post.media ? JSON.parse(post.media) : [];
    } else {
      newMedia = post.media || [];
    }
    
    // Store a copy of the old media for deletion later
    oldMedia = [...newMedia];
    
    console.log("oldMedia:", JSON.stringify(oldMedia, null, 2));

    let filesToDelete = [];

    // If new media is uploaded, replace all old media
    if (hasNewMedia) {
      // Mark all old media files for deletion
      filesToDelete = oldMedia.map((m) => m.file);
      // Replace old media with new media
      newMedia = uploads;
      console.log("Replacing all media - filesToDelete:", filesToDelete);
    } else {
      // If no new media, handle optional removals by filenames
      const removeImages = toIdArray(req.body.removeImages) || [];
      const removeVideo =
        String(req.body.removeVideo || "false").toLowerCase() === "true";

      if (removeImages.length) {
        // Mark specific images for deletion
        filesToDelete.push(...removeImages);
        newMedia = newMedia.filter((m) => {
          if (m.type === "image" && removeImages.includes(m.file)) {
            return false;
          }
          return true;
        });
        console.log("Remove images mode - filesToDelete:", filesToDelete);
      }

      if (removeVideo) {
        // Mark video files for deletion
        const videoFiles = oldMedia.filter(m => m.type === "video").map(m => m.file);
        filesToDelete.push(...videoFiles);
        newMedia = newMedia.filter((m) => {
          if (m.type === "video") {
            return false;
          }
          return true;
        });
        console.log("Remove video mode - filesToDelete:", filesToDelete);
      }
    }
    
    console.log("Final filesToDelete:", filesToDelete);
    console.log("Final newMedia:", JSON.stringify(newMedia, null, 2));

    // Apply field updates
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;

    // soft hide toggle from body
    if (typeof req.body.isDeleted !== "undefined") {
      const val = String(req.body.isDeleted).toLowerCase();
      post.isDeleted = val === "true" || val === "1";
    }

    post.media = JSON.stringify(newMedia); // Stringify media to store as JSON string

    await post.save({ transaction });

    // Validate tags if provided
    if (req.body.tags !== undefined) {
      // Handle tags as comma-separated string or array
      let tagIds = [];
      if (typeof req.body.tags === 'string') {
        tagIds = req.body.tags.split(',').map(tag => parseInt(tag.trim())).filter(tag => !isNaN(tag));
      } else if (Array.isArray(req.body.tags)) {
        tagIds = req.body.tags.map(tag => parseInt(tag)).filter(tag => !isNaN(tag));
      }
      
      // Check if all tags exist
      if (tagIds.length > 0) {
        const { Tag } = require('../../models');
        const existingTags = await Tag.findAll({
          where: {
            id: tagIds
          },
          attributes: ['id'],
          transaction
        });
        
        const existingTagIds = existingTags.map(tag => tag.id);
        const missingTagIds = tagIds.filter(id => !existingTagIds.includes(id));
        
        if (missingTagIds.length > 0) {
          const error = new Error(`The following tags do not exist: ${missingTagIds.join(', ')}`);
          error.status = 400;
          throw error;
        }
        
        post.tags = existingTagIds.filter(id => tagIds.includes(id));
      } else {
        post.tags = [];
      }
    }
    
    // Validate services if provided
    if (req.body.services !== undefined) {
      // Handle services as comma-separated string or array
      let serviceIds = [];
      if (typeof req.body.services === 'string') {
        serviceIds = req.body.services.split(',').map(service => parseInt(service.trim())).filter(service => !isNaN(service));
      } else if (Array.isArray(req.body.services)) {
        serviceIds = req.body.services.map(service => parseInt(service)).filter(service => !isNaN(service));
      }
      
      // Check if all services exist
      if (serviceIds.length > 0) {
        const { Service } = require('../../models');
        const existingServices = await Service.findAll({
          where: {
            id: serviceIds
          },
          attributes: ['id'],
          transaction
        });
        
        const existingServiceIds = existingServices.map(service => service.id);
        const missingServiceIds = serviceIds.filter(id => !existingServiceIds.includes(id));
        
        if (missingServiceIds.length > 0) {
          const error = new Error(`The following services do not exist: ${missingServiceIds.join(', ')}`);
          error.status = 400;
          throw error;
        }
        
        post.services = existingServiceIds.filter(id => serviceIds.includes(id));
      } else {
        post.services = [];
      }
    }
    
    await post.save({ transaction });

    // Commit the transaction if everything is successful
    await transaction.commit();

    // Now delete old media files that are no longer needed
    if (filesToDelete.length > 0) {
      console.log("Attempting to delete old media files:", filesToDelete);
      try {
        // Use the safeDeleteFiles function which handles the correct path construction
        const deleteResult = await safeDeleteFiles(filesToDelete);
        console.log("✅ Delete result:", deleteResult);
        if (deleteResult) {
          console.log(`✅ Successfully deleted ${deleteResult.data?.deletedCount || 0} files`);
          if (deleteResult.data?.failedCount > 0) {
            console.log(`⚠️ Failed to delete ${deleteResult.data.failedCount} files`);
          }
        }
      } catch (err) {
        console.error("❌ Error deleting old media files:", err);
      }
    }

    const populated = await Post.findByPk(post.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ]
    });
    
    // Format response to match desired structure
    const postJson = populated.toJSON();
    const formattedResponse = {
      _id: postJson.id,
      author: {
        _id: postJson.user.id,
        firstName: postJson.user.firstName,
        lastName: postJson.user.lastName,
        username: postJson.user.username,
        image: postJson.user.image,
        isActive: postJson.user.isActive,
        imageUrl: `/public/uploads/images/users/${postJson.user.image}`,
        id: postJson.user.id
      },
      title: postJson.title,
      content: postJson.content,
      media: postJson.media ? (typeof postJson.media === 'string' ? JSON.parse(postJson.media) : postJson.media) : [],
      tags: postJson.tags ? (typeof postJson.tags === 'string' ? JSON.parse(postJson.tags) : postJson.tags) : [],
      services: postJson.services ? (typeof postJson.services === 'string' ? JSON.parse(postJson.services) : postJson.services) : [],
      likesCount: postJson.likesCount,
      commentsCount: postJson.commentsCount,
      sharesCount: postJson.sharesCount,
      viewsCount: postJson.viewsCount,
      isDeleted: postJson.isDeleted,
      status: postJson.status,
      rejectionReason: postJson.rejectionReason,
      createdAt: postJson.createdAt,
      updatedAt: postJson.updatedAt,
      id: postJson.id
    };

    res.json({ status: "success", data: formattedResponse });
  } catch (e) {
    // Rollback transaction on error
    if (transaction && !transaction.finished) {
      try {
        await transaction.rollback();
      } catch (rollbackError) {
        console.error("Error rolling back transaction:", rollbackError);
      }
    }
    next(e);
  }
};

// Social Media Sharing - الدالة الوحيدة للمشاركة
exports.share = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { platform = 'other' } = req.body;
    
    // 1. التحقق من صحة المنصة مع رسائل خطأ واضحة
    const allowedPlatforms = ['facebook', 'instagram', 'twitter', 'whatsapp', 'telegram', 'linkedin', 'other'];
    if (!allowedPlatforms.includes(platform)) {
      return res.status(400).json({ 
        status: "error", 
        message: `منصة المشاركة '${platform}' غير مدعومة. المنصات المدعومة هى: ${allowedPlatforms.join(', ')}.`,
        allowedPlatforms,
        code: "UNSUPPORTED_PLATFORM"
      });
    }

    // 2. البحث عن المنشور
    const post = await Post.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });
      
    if (!post) {
      return res.status(404).json({ 
        status: "error", 
        message: "المنشور غير موجود",
        code: "POST_NOT_FOUND"
      });
    }

    if (post.isDeleted) {
      return res.status(410).json({ 
        status: "error", 
        message: "المنشور غير متاح (تم حذفه)",
        code: "POST_DELETED"
      });
    }

    // 3. توليد روابط آمنة ومتناسقة مع بيئات مختلفة
    const isProduction = process.env.NODE_ENV === 'production';
    const baseUrl = process.env.FRONTEND_URL || (isProduction ? 'https://visitsyria.fun' : 'https://visitsyria.fun');
    const serverUrl = process.env.MEDIA_BASE_URL || baseUrl;
    const apiPrefix = process.env.API || '/api/v1';
    
    // رابط Open Graph الوحيد للمشاركة والمعاينة
    const postUrl = `${serverUrl}${apiPrefix}/posts/${id}/og`;
    
    // 4. إعداد نص المشاركة مع حماية من البيانات الحساسة
    const safeTitle = (post.title || 'منشور').substring(0, 100); // تحديد طول العنوان
    const shareText = `${safeTitle} - منشور من تطبيق سوريا بعيون ناسها`;
    
    // 4.1. الحصول على روابط الوسائط بشكل آمن
    let imageUrl = null;
    let videoUrl = null;
    
    if (post.media) {
      const media = JSON.parse(post.media);
      const primaryImage = media.find(m => m.type === 'image');
      const primaryVideo = media.find(m => m.type === 'video');
      
      imageUrl = primaryImage?.file ? 
        `${serverUrl}/public/uploads/images/posts/${encodeURIComponent(primaryImage.file)}` : null;
      videoUrl = primaryVideo?.file ? 
        `${serverUrl}/public/uploads/videos/${primaryVideo.file}` : null;
    }
    
    // 5. توليد روابط محسّنة للمنصات
    const shareUrls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
      twitter: `https://x.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(shareText + '\n\n' + postUrl)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
      instagram: { url: `https://www.instagram.com/share?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(shareText)}`
      },
      other: {
        url: postUrl,
        text: shareText,
        note: "نسخ الرابط ومشاركته في المنصة المطلوبة"
      }
    };

    // 6. تحديث عداد المشاركة
    await post.increment('sharesCount');
    
    // Reload post to get updated sharesCount
    const updatedPost = await Post.findByPk(id);

    // 7. إعداد استجابة محسّنة وشاملة
    const response = {
      status: "success",
      message: "تم تسجيل المشاركة بنجاح",
      timestamp: new Date().toISOString(),
      data: {
        postId: id,
        sharesCount: updatedPost.sharesCount,
        platform: platform,
        postUrl: postUrl,
        shareUrl: shareUrls[platform] || shareUrls.other,
        // روابط مباشرة لجميع المنصات
        directShareLinks: {
          facebook: shareUrls.facebook,
          twitter: shareUrls.twitter,
          whatsapp: shareUrls.whatsapp,
          telegram: shareUrls.telegram,
          linkedin: shareUrls.linkedin,
          instagram: shareUrls.instagram
        },
        // معلومات آمنة للمنشور
        postData: {
          title: safeTitle,
          content: post.content ? post.content.substring(0, 300) + '...' : null,
          author: `${post.user.firstName} ${post.user.lastName}`,
          hasImage: !!imageUrl,
          hasVideo: !!videoUrl,
          imageUrl: imageUrl,
          videoUrl: videoUrl
        }
      }
    };

    res.json(response);
  } catch (e) {
    console.error('Share function error:', {
      error: e.message,
      stack: e.stack,
      postId: req.params.id,
      platform: req.body.platform,
      timestamp: new Date().toISOString()
    });
    
    // رسائل خطأ واضحة ومفيدة
    const errorResponse = {
      status: "error",
      message: "حدث خطأ غير متوقع أثناء معالجة طلب المشاركة",
      code: "INTERNAL_SERVER_ERROR",
      timestamp: new Date().toISOString()
    };
    
    next(e); // تمرير الخطأ لمعالج الأخطاء العام
  }
};

// إخفاء بوست (Soft Hide) - يسمح للمالك أو الأدمن فقط
exports.toggleHidden = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    const { id } = req.params;
    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error("Not found");
      error.status = 401;
      throw error;
    }

    const isAdmin = Boolean(req.auth?.isAdmin);
    const isOwner = post.userId === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // التبديل: إذا كانت مُخفئة اجعلها مرئية، وإذا كانت مرئية اجعلها مخفية
    post.isDeleted = !Boolean(post.isDeleted);
    await post.save();

    const populated = await Post.findByPk(post.id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive']
        }
      ]
    });

    res.json({
      status: "success",
      data: populated,
      hidden: Boolean(post.isDeleted),
    });
  } catch (e) {
    next(e);
  }
};

exports.remove = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { id } = req.params;

    const post = await Post.findByPk(id);
    if (!post) {
      const error = new Error("Not found");
      error.status = 401;
      throw error;
    }

    const isAdmin = Boolean(req.auth?.isAdmin);
    const isOwner = post.userId === userId;
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ status: "error", message: "Forbidden" });
    }

    // delete media files
    if (post.media) {
      const media = JSON.parse(post.media);
      const imageFiles = media
        .filter((m) => m.type === "image")
        .map((m) => m.file);
      const videoFiles = media
        .filter((m) => m.type === "video")
        .map((m) => m.file);
      await deleteMultipleFiles([...imageFiles, ...videoFiles], "posts");
    }

    // Delete related records
    await Like.destroy({ where: { postId: id }, transaction });
    await Save.destroy({ where: { postId: id }, transaction });
    await Comment.destroy({ where: { postId: id }, transaction });

    // Delete the post
    await Post.destroy({ where: { id }, transaction });
    
    // Commit transaction
    await transaction.commit();
    
    res.json({ status: "success", message: "Deleted" });
  } catch (e) {
    // Rollback transaction on error
    await transaction.rollback();
    next(e);
  }
};

// Get post as HTML page with Open Graph metadata for social sharing
exports.getOpenGraphPage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const fs = require('fs');
    const path = require('path');
    
    // Get post data
    const post = await Post.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username']
        }
      ]
    });
      
    if (!post || post.isDeleted) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>منشور غير موجود - سوريا بعيون ناسها</title>
          <meta name="description" content="المنشور المطلوب غير موجود أو غير متاح">
        </head>
        <body>
          <h1>المنشور غير موجود</h1>
          <p>عذراً، المنشور المطلوب غير موجود أو غير متاح.</p>
        </body>
        </html>
      `);
    }
    
    // Build data for template
    const serverUrl = 'https://visitsyria.fun';
    let imageUrl = null;
    let videoUrl = null;
    
    if (post.media) {
      const media = JSON.parse(post.media);
      const primaryImage = media.find(m => m.type === 'image');
      const primaryVideo = media.find(m => m.type === 'video');
      imageUrl = primaryImage ? `${serverUrl}/public/uploads/images/posts/${primaryImage.file}` : null;
      videoUrl = primaryVideo ? `${serverUrl}/public/uploads/videos/${primaryVideo.file}` : null;
    }
    
    const postUrl = `${serverUrl}/api/v1/posts/${id}/og`;
    const authorName = `${post.user.firstName} ${post.user.lastName}`;
    
    // Escape HTML special characters
    const escapeHtml = (str) => {
      if (!str) return '';
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };
    
    const templateData = {
      postId: id,
      title: escapeHtml(post.title || 'منشور من سوريا بعيون ناسها'),
      description: escapeHtml(post.content || 'منشور من تطبيق سوريا بعيون ناسها'),
      author: escapeHtml(authorName),
      content: escapeHtml(post.content || 'منشور من تطبيق سوريا بعيون ناسها'),
      imageUrl: imageUrl,
      videoUrl: videoUrl,
      canonicalUrl: postUrl
    };
    
    // Read HTML template
    const templatePath = path.join(__dirname, '../../views/post-preview.html');
    let htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    
    // Simple template replacement function
    const renderTemplate = (template, data) => {
      let result = template;
      
      // Replace simple variables
      Object.keys(data).forEach(key => {
        const value = data[key] || '';
        const regex = new RegExp('{{' + key + '}}', 'g');
        result = result.replace(regex, value);
      });
      
      // Handle conditional blocks for imageUrl
      if (data.imageUrl) {
        result = result.replace(/\{\{#if imageUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        result = result.replace(/\{\{#if imageUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      // Handle conditional blocks for videoUrl  
      if (data.videoUrl) {
        result = result.replace(/\{\{#if videoUrl\}\}([\s\S]*?)\{\{\/if\}\}/g, '$1');
      } else {
        result = result.replace(/\{\{#if videoUrl\}\}[\s\S]*?\{\{\/if\}\}/g, '');
      }
      
      return result;
    };
    
    const finalHtml = renderTemplate(htmlTemplate, templateData);
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(finalHtml);
    
  } catch (e) {
    console.error('OG Page Error:', e);
    next(e);
  }
};

/**
 * جلب المنشورات بناءً على اهتمامات المستخدم مع ترقيق الصفحات
 */
exports.getPostsByUserInterests = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const offset = (page - 1) * limit;

    // الحصول على اهتمامات المستخدم
    const user = await User.findByPk(userId, {
      include: [{
        model: Tag,
        as: 'interests',
        attributes: ['id'],
        through: { attributes: [] } // Don't include UserInterest attributes
      }]
    });

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    const interestIds = user.interests.map(interest => interest.id);

    // إذا لم يكن لدى المستخدم اهتمامات، نعيد قائمة فارغة
    if (interestIds.length === 0) {
      return res.status(200).json({
        status: "success",
        data: {
          posts: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalPosts: 0,
            hasNext: false,
            hasPrev: false,
            pageSize: limit
          }
        }
      });
    }

    // جلب المنشورات المرتبطة بالوسوم التي يهتم بها المستخدم
    // First, get all posts
    const allPosts = await Post.findAll({
      where: {
        isDeleted: false,
        status: "approved"
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'isActive'],
          where: { isActive: true },
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Filter posts that have at least one tag matching user interests
    const filteredPosts = allPosts.filter(post => {
      // Parse tags if they're stored as a string
      let postTags = [];
      if (typeof post.tags === 'string') {
        try {
          postTags = JSON.parse(post.tags);
        } catch (e) {
          postTags = [];
        }
      } else if (Array.isArray(post.tags)) {
        postTags = post.tags;
      }
      
      // Check if any of the post's tags match user interests
      return postTags.some(tagId => interestIds.includes(tagId));
    });

    // Apply pagination to filtered posts
    const total = filteredPosts.length;
    const paginatedPosts = filteredPosts.slice(offset, offset + limit);

    // Format the response to match the desired structure
    const formattedItems = paginatedPosts.map(item => {
      const itemJson = item.toJSON();
      return {
        _id: itemJson.id,
        author: {
          _id: itemJson.user.id,
          firstName: itemJson.user.firstName,
          lastName: itemJson.user.lastName,
          username: itemJson.user.username,
          image: itemJson.user.image,
          isActive: itemJson.user.isActive,
          imageUrl: `/public/uploads/images/users/${itemJson.user.image}`,
          id: itemJson.user.id
        },
        title: itemJson.title,
        content: itemJson.content,
        media: itemJson.media ? (typeof itemJson.media === 'string' ? JSON.parse(itemJson.media) : itemJson.media) : [],
        tags: itemJson.tags ? (typeof itemJson.tags === 'string' ? JSON.parse(itemJson.tags) : itemJson.tags) : [],
        services: itemJson.services ? (typeof itemJson.services === 'string' ? JSON.parse(itemJson.services) : itemJson.services) : [],
        likesCount: itemJson.likesCount,
        commentsCount: itemJson.commentsCount,
        sharesCount: itemJson.sharesCount,
        viewsCount: itemJson.viewsCount,
        isDeleted: itemJson.isDeleted,
        status: itemJson.status,
        rejectionReason: itemJson.rejectionReason,
        createdAt: itemJson.createdAt,
        updatedAt: itemJson.updatedAt,
        id: itemJson.id
      };
    });

    res.status(200).json({
      status: "success",
      data: {
        posts: formattedItems,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
          pageSize: limit
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Utility function to clean up references to deleted tags in all posts
async function cleanupDeletedTagReferences(deletedTagId) {
  try {
    const { Post } = require('../../models');
    
    // Find all posts (we'll filter manually to avoid sequelize.Op issues)
    const posts = await Post.findAll();
    
    let updatedCount = 0;
    for (const post of posts) {
      let tagsArray = [];
      if (typeof post.tags === 'string') {
        try {
          tagsArray = JSON.parse(post.tags);
        } catch (e) {
          tagsArray = [];
        }
      } else if (Array.isArray(post.tags)) {
        tagsArray = post.tags;
      }
      
      // Check if this post contains the deleted tag
      if (tagsArray.includes(deletedTagId)) {
        // Remove ONLY the deleted tag ID
        const updatedTags = tagsArray.filter(tagId => tagId !== deletedTagId);
        
        // Update the post with cleaned tags
        await post.update({ tags: updatedTags });
        updatedCount++;
      }
    }
    
    console.log(`Cleaned up references to deleted tag ${deletedTagId} from ${updatedCount} posts`);
  } catch (error) {
    console.error('Error cleaning up deleted tag references:', error);
  }
}

// Utility function to clean up references to deleted services in all posts
async function cleanupDeletedServiceReferences(deletedServiceId) {
  try {
    const { Post } = require('../../models');
    
    // Find all posts (we'll filter manually to avoid sequelize.Op issues)
    const posts = await Post.findAll();
    
    let updatedCount = 0;
    for (const post of posts) {
      let servicesArray = [];
      if (typeof post.services === 'string') {
        try {
          servicesArray = JSON.parse(post.services);
        } catch (e) {
          servicesArray = [];
        }
      } else if (Array.isArray(post.services)) {
        servicesArray = post.services;
      }
      
      // Check if this post contains the deleted service
      if (servicesArray.includes(deletedServiceId)) {
        // Remove ONLY the deleted service ID
        const updatedServices = servicesArray.filter(serviceId => serviceId !== deletedServiceId);
        
        // Update the post with cleaned services
        await post.update({ services: updatedServices });
        updatedCount++;
      }
    }
    
    console.log(`Cleaned up references to deleted service ${deletedServiceId} from ${updatedCount} posts`);
  } catch (error) {
    console.error('Error cleaning up deleted service references:', error);
  }
}

// Export these functions so they can be used from other controllers
module.exports = {
  create: exports.create,
  list: exports.list,
  listMine: exports.listMine,
  get: exports.get,
  update: exports.update,
  remove: exports.remove,
  top: exports.top,
  getPostsByUserInterests: exports.getPostsByUserInterests,
  share: exports.share,
  toggleHidden: exports.toggleHidden,
  getOpenGraphPage: exports.getOpenGraphPage,
  addComment: exports.addComment,
  cleanupDeletedTagReferences,
  cleanupDeletedServiceReferences
};
















































































