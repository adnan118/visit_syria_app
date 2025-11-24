/*
ملف التحكم في منشورات الإدارة (admin/posts.js)
------------------------------------------
- يحتوي على جميع الدوال الخاصة بإدارة المنشورات للوحة الإدارة
- يتطلب صلاحيات إدارية للوصول لهذه الدوال
*/

const { Post, User } = require("../../models");
const sequelize = require("../../models/sequelize");

/**
 * عرض جميع المنشورات المعلقة (للإدارة)
 */
exports.getPendingPosts = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // الحصول على المنشورات المعلقة فقط
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where: { status: "pending" },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
      
    return res.status(200).json({
      status: "success",
      message: "Pending posts retrieved successfully",
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * الموافقة على منشور (للإدارة)
 */
exports.approvePost = async function (req, res, next) {
  try {
    const { id } = req.params;
    
    // البحث عن المنشور وتحديث حالته
    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
        }
      ]
    });
    
    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    
    await post.update({ 
      status: "approved", 
      rejectionReason: null 
    });
    
    return res.status(200).json({
      status: "success",
      message: "Post approved successfully",
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * رفض منشور (للإدارة)
 */
exports.rejectPost = async function (req, res, next) {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    // البحث عن المنشور وتحديث حالته
    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
        }
      ]
    });
    
    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    
    await post.update({ 
      status: "rejected", 
      rejectionReason: rejectionReason || null 
    });
    
    return res.status(200).json({
      status: "success",
      message: "Post rejected successfully",
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض منشور محدد حسب المعرف (للإدارة)
 */
exports.getPostById = async function (req, res, next) {
  try {
    const { id } = req.params;
    
    const post = await Post.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
        }
      ]
    });
    
    if (!post) {
      const error = new Error("Post not found");
      error.status = 404;
      throw error;
    }
    
    return res.status(200).json({
      status: "success",
      message: "Post retrieved successfully",
      data: post
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض جميع المنشورات بغض النظر عن الحالة (للإدارة)
 */
exports.getAllPosts = async function (req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // الحصول على معلمات التصفية
    let where = {};
    
    // تصفية حسب الحالة
    if (req.query.status) {
      where.status = req.query.status;
    }
    
    // البحث حسب الكلمات المفتاحية
    if (req.query.search) {
      where[sequelize.Op.or] = [
        { title: { [sequelize.Op.like]: `%${req.query.search}%` } },
        { content: { [sequelize.Op.like]: `%${req.query.search}%` } }
      ];
    }
    
    const { rows: posts, count: total } = await Post.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset
    });
      
    return res.status(200).json({
      status: "success",
      message: "Posts retrieved successfully",
      data: {
        posts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalPosts: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    next(error);
  }
};