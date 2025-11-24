/*
 * Controller for User Interests
 * 
 * This controller handles all operations related to user interests (tags).
 */

const { User, Tag } = require("../../models");

/**
 * إضافة اهتمامات للمستخدم
 */
exports.addInterests = async function (req, res, next) {
  try {
    const { userId } = req.params;
    const { tagIds } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // التحقق من وجود التاغات
    const tags = await Tag.findAll({
      where: {
        id: tagIds
      }
    });

    if (tags.length !== tagIds.length) {
      const error = new Error("One or more tags not found");
      error.status = 404;
      throw error;
    }

    // إضافة الاهتمامات للمستخدم
    await user.addInterests(tags);

    res.status(200).json({
      status: "success",
      message: "Interests added successfully",
      data: {
        userId,
        addedTags: tags.map(tag => ({
          id: tag.id,
          nameAr: tag.nameAr,
          nameEn: tag.nameEn,
          slug: tag.slug
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض اهتمامات المستخدم
 */
exports.getUserInterests = async function (req, res, next) {
  try {
    const { userId } = req.params;

    // التحقق من وجود المستخدم
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // الحصول على اهتمامات المستخدم
    const interests = await user.getInterests({
      attributes: ['id', 'nameAr', 'nameEn', 'slug']
    });

    res.status(200).json({
      status: "success",
      data: {
        userId,
        interests
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * إزالة اهتمام معين من المستخدم
 */
exports.removeInterest = async function (req, res, next) {
  try {
    const { userId, tagId } = req.params;

    // التحقق من وجود المستخدم
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // التحقق من وجود التاغ
    const tag = await Tag.findByPk(tagId);
    if (!tag) {
      const error = new Error("Tag not found");
      error.status = 404;
      throw error;
    }

    // إزالة الاهتمام
    await user.removeInterest(tag);

    res.status(200).json({
      status: "success",
      message: "Interest removed successfully"
    });
  } catch (error) {
    next(error);
  }
};

 
/**
 * تحديث جميع اهتمامات المستخدم دفعة واحدة
 */
exports.updateAllInterests = async function (req, res, next) {
  try {
    const { userId } = req.params;
    const { tagIds } = req.body;

    // التحقق من وجود المستخدم
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // التحقق من وجود التاغات
    const tags = await Tag.findAll({
      where: {
        id: tagIds
      }
    });

    if (tags.length !== tagIds.length) {
      const error = new Error("One or more tags not found");
      error.status = 404;
      throw error;
    }

    // تحديث جميع الاهتمامات (يستبدل الاهتمامات الحالية)
    await user.setInterests(tags);

    res.status(200).json({
      status: "success",
      message: "All interests updated successfully",
      data: {
        userId,
        interests: tags.map(tag => ({
          id: tag.id,
          nameAr: tag.nameAr,
          nameEn: tag.nameEn,
          slug: tag.slug
        }))
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * إزالة جميع اهتمامات المستخدم
 */
exports.removeAllInterests = async function (req, res, next) {
  try {
    const { userId } = req.params;

    // التحقق من وجود المستخدم
    const user = await User.findByPk(userId);
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // إزالة جميع الاهتمامات
    await user.setInterests([]);

    res.status(200).json({
      status: "success",
      message: "All interests removed successfully"
    });
  } catch (error) {
    next(error);
  }
};