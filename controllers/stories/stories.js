// controllers/stories/stories.js
const { Story, Tag, User } = require("../../models");
const { deleteMultipleFiles } = require("../services/mediaHelper");
const sequelize = require("../../models/sequelize");
const { Op } = require("sequelize");

function buildStoryMedia(req) {
  const media = [];
  if (req.dbFiles?.images?.length)
    media.push(...req.dbFiles.images.map((f) => ({ type: "image", file: f })));
  if (req.dbFiles?.videos?.length)
    media.push(...req.dbFiles.videos.map((f) => ({ type: "video", file: f })));
  return media;
}

// Normalize tags from body: accept array of ObjectIds or slugs
async function normalizeTags(rawTags) {
  if (!rawTags) return [];
  let tags = rawTags;

  if (typeof rawTags === "string") {
    try {
      tags = JSON.parse(rawTags);
    } catch (_) {
      tags = rawTags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  if (!Array.isArray(tags)) return [];

  // For Sequelize, we'll just return the tags as they are
  // In a real implementation, you would validate them against the database
  return tags;
}

exports.create = async (req, res, next) => {
  // Start a transaction for database operations
  const transaction = await sequelize.transaction();
  let uploadedFiles = [];
  
  try {
    const userId = req.auth?.id;

    if (!userId) {
      const error = new Error("Authentication required to create a story");
      error.status = 401;
      throw error;
    }

    // Check active stories limit
    const activeStoriesCount = await Story.count({
      where: {
        userId: userId,
        expiresAt: { [Op.gt]: new Date() },
      },
      transaction
    });
    
    if (activeStoriesCount >= 5) {
      const error = new Error(
        "You have reached the maximum number of active stories (5). Please wait for some to expire or delete old ones."
      );
      error.status = 400;
      throw error;
    }

    const { caption, tags, location } = req.body;
    const media = buildStoryMedia(req);
    
    // Store uploaded files for potential cleanup
    if (req.dbFiles) {
      if (req.dbFiles.images) uploadedFiles.push(...req.dbFiles.images);
      if (req.dbFiles.videos) uploadedFiles.push(...req.dbFiles.videos);
    }

    // Check if media is empty - stories must have at least one media item
    if (!media || media.length === 0) {
      const error = new Error("Story must contain at least one image or video");
      error.status = 401;
      throw error;
    }

    // Check media count limit
    if (media.length > 5) {
      const error = new Error(
        "A story can contain at most 5 media items (images or videos)."
      );
      error.status = 400;
      throw error;
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

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    const story = await Story.create({
      userId: userId,
      caption,
      location,
      media: JSON.stringify(media), // Stringify media to store as JSON string
      tags: validTagIds, // Store validated tags
      expiresAt,
      views: [], // Initialize views as empty array
    }, { transaction });
    
    // Commit the transaction if everything is successful
    await transaction.commit();
    
    // Format response to match desired structure
    const storyJson = story.toJSON();
    const formattedResponse = {
      author: storyJson.userId, // Changed from author object to userId
      caption: storyJson.caption,
      location: storyJson.location,
      media: storyJson.media ? (typeof storyJson.media === 'string' ? JSON.parse(storyJson.media) : storyJson.media) : [],
      tags: storyJson.tags ? (typeof storyJson.tags === 'string' ? JSON.parse(storyJson.tags) : storyJson.tags) : [],
      expiresAt: storyJson.expiresAt,
      views: storyJson.views ? (typeof storyJson.views === 'string' ? JSON.parse(storyJson.views) : storyJson.views) : [],
      viewCount: storyJson.viewCount,
      createdAt: storyJson.createdAt,
      updatedAt: storyJson.updatedAt
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
        await deleteMultipleFiles(uploadedFiles, "stories");
        console.log("Cleaned up uploaded files due to story creation failure");
      } catch (cleanupError) {
        console.error("Error cleaning up uploaded files:", cleanupError);
      }
    }
    
    next(e);
  }
};

exports.listMine = async (req, res, next) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      const error = new Error("Authentication required to view your stories");
      error.status = 401;
      throw error;
    }
    
    // جلب الستوريز الخاصة بالمستخدم والتي لم تنتهِ صلاحيتها
    const items = await Story.findAll({
      where: {
        userId: userId,
        expiresAt: { [Op.gt]: new Date() }, // فقط الستوريز النشطة
      },
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['firstName', 'lastName', 'username', 'image'] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Format response to match desired structure
    const formattedItems = items.map(item => {
      const itemJson = item.toJSON();
      return {
        author: itemJson.userId,
        caption: itemJson.caption,
        location: itemJson.location,
        media: itemJson.media ? (typeof itemJson.media === 'string' ? JSON.parse(itemJson.media) : itemJson.media) : [],
        tags: itemJson.tags ? (typeof itemJson.tags === 'string' ? JSON.parse(itemJson.tags) : itemJson.tags) : [],
        expiresAt: itemJson.expiresAt,
        views: itemJson.views ? (typeof itemJson.views === 'string' ? JSON.parse(itemJson.views) : itemJson.views) : [],
        viewCount: itemJson.viewCount,
        createdAt: itemJson.createdAt,
        updatedAt: itemJson.updatedAt
      };
    });
    
    res.json({ status: "success", data: formattedItems });
  } catch (e) {
    next(e);
  }
};

exports.feed = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const filter = { 
      expiresAt: { [Op.gt]: new Date() } 
    };

    // Hide stories of inactive users from public feed
    const activeUserIds = await User.findAll({
      where: { isActive: true },
      attributes: ['id']
    });
    
    filter.userId = {
      [Op.in]: activeUserIds.map(user => user.id)
    };

    const { rows: items, count: total } = await Story.findAndCountAll({
      where: filter,
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
    
    // Format response to match desired structure
    const formattedItems = items.map(item => {
      const itemJson = item.toJSON();
      return {
        author: itemJson.userId,
        caption: itemJson.caption,
        location: itemJson.location,
        media: itemJson.media ? (typeof itemJson.media === 'string' ? JSON.parse(itemJson.media) : itemJson.media) : [],
        tags: itemJson.tags ? (typeof itemJson.tags === 'string' ? JSON.parse(itemJson.tags) : itemJson.tags) : [],
        expiresAt: itemJson.expiresAt,
        views: itemJson.views ? (typeof itemJson.views === 'string' ? JSON.parse(itemJson.views) : itemJson.views) : [],
        viewCount: itemJson.viewCount,
        createdAt: itemJson.createdAt,
        updatedAt: itemJson.updatedAt
      };
    });

    res.json({
      status: "success",
      data: formattedItems,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStories: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
        pageSize: limit,
      },
    });
  } catch (e) {
    next(e);
  }
};

exports.view = async (req, res, next) => {
  try {
    const userId = req.auth?.id;

    if (!userId) {
      const error = new Error("Authentication required to view your story");
      error.status = 401;
      throw error;
    }

    const { id } = req.params;
    const story = await Story.findByPk(id, {
      include: [
        { 
          model: User, 
          as: 'user', 
          attributes: ['isActive']
        }
      ]
    });

    if (!story) {
      const error = new Error("Story not found");
      error.status = 401;
      throw error;
    }

    // منع عرض ستوري لمؤلف غير نشط
    if (story.user && story.user.isActive === false) {
      const error = new Error("Story not found");
      error.status = 404;
      throw error;
    }

    // التحقق من انتهاء الصلاحية
    if (story.expiresAt < new Date()) {
      const error = new Error("Story has expired");
      error.status = 401;
      throw error;
    }

    // For simplicity, we'll just increment the view count
    // In a real implementation, you would track individual viewers
    await story.increment('viewCount');

    // Reload the story to get the updated view count
    const updatedStory = await Story.findByPk(id);

    // Format response to match desired structure
    const storyJson = updatedStory.toJSON();
    const formattedResponse = {
      author: storyJson.userId, // Changed from author object to userId
      caption: storyJson.caption,
      location: storyJson.location,
      media: storyJson.media ? (typeof storyJson.media === 'string' ? JSON.parse(storyJson.media) : storyJson.media) : [],
      tags: storyJson.tags ? (typeof storyJson.tags === 'string' ? JSON.parse(storyJson.tags) : storyJson.tags) : [],
      expiresAt: storyJson.expiresAt,
      views: storyJson.views ? (typeof storyJson.views === 'string' ? JSON.parse(storyJson.views) : storyJson.views) : [],
      viewCount: storyJson.viewCount,
      createdAt: storyJson.createdAt,
      updatedAt: storyJson.updatedAt
    };

    res.json({
      status: "success",
      message: "Story viewed",
      data: formattedResponse,
    });
  } catch (e) {
    next(e);
  }
};

exports.delete = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const userId = req.auth?.id;

    if (!userId) {
      const error = new Error("Authentication required to delete a story");
      error.status = 401;
      throw error;
    }
    
    const { id } = req.params;
    const story = await Story.findOne({
      where: { 
        id: id, 
        userId: userId 
      }
    });

    if (!story) {
      const error = new Error("Story not found or you are not the author");
      error.status = 401;
      throw error;
    }
    
    // جمع أسماء الملفات لحذفها
    let filesToDelete = [];
    if (story.media) {
      const media = JSON.parse(story.media);
      filesToDelete = media.map((m) => m.file);
    }

    // حذف الستوري
    await Story.destroy({ 
      where: { 
        id: id 
      },
      transaction
    });

    // حذف الملفات من الـ disk
    if (filesToDelete.length > 0) {
      try {
        await deleteMultipleFiles(filesToDelete, "stories");
      } catch (e) {
        console.error("Error deleting story files:", e);
      }
    }
    
    // Commit transaction
    await transaction.commit();

    res.json({ status: "success", message: "Story deleted successfully" });
  } catch (e) {
    // Rollback transaction on error
    await transaction.rollback();
    next(e);
  }
};

// Utility function to clean up references to deleted tags in all stories
async function cleanupDeletedTagReferencesInStories(deletedTagId) {
  try {
    const { Story } = require('../../models');
    
    // Find all stories (we'll filter manually to avoid sequelize.Op issues)
    const stories = await Story.findAll();
    
    let updatedCount = 0;
    for (const story of stories) {
      let tagsArray = [];
      if (typeof story.tags === 'string') {
        try {
          tagsArray = JSON.parse(story.tags);
        } catch (e) {
          tagsArray = [];
        }
      } else if (Array.isArray(story.tags)) {
        tagsArray = story.tags;
      }
      
      // Check if this story contains the deleted tag
      if (tagsArray.includes(deletedTagId)) {
        // Remove ONLY the deleted tag ID
        const updatedTags = tagsArray.filter(tagId => tagId !== deletedTagId);
        
        // Update the story with cleaned tags
        await story.update({ tags: updatedTags });
        updatedCount++;
      }
    }
    
    console.log(`Cleaned up references to deleted tag ${deletedTagId} from ${updatedCount} stories`);
  } catch (error) {
    console.error('Error cleaning up deleted tag references in stories:', error);
  }
}

// Export these functions so they can be used from other controllers
module.exports = {
  create: exports.create,
  listMine: exports.listMine,
  feed: exports.feed,
  view: exports.view,
  delete: exports.delete,
  cleanupDeletedTagReferencesInStories
};
