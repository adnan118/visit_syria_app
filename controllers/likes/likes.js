// controllers/likes/likes.js
// إدارة الإعجابات بشكل منفصل لتقليل تكرار الكود
// المنطق:
// - toggle: يعجب/يلغي الإعجاب ويحدّث العداد الذكي في Post
// - listByMe: كل المنشورات التي أعجبت بها (مفيدة للملف الشخصي)

const { Like, Post, User } = require("../../models");
const sequelize = require("../../models/sequelize");

exports.toggle = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { postId } = req.params;

    const found = await Like.findOne({ 
      where: { 
        postId: postId, 
        userId: userId 
      } 
    });
    
    if (found) {
      await found.destroy();
      const post = await Post.findByPk(postId);
      if (post) {
        await post.decrement('likesCount');
        await post.reload();
      }
      return res.json({
        status: "success",
        liked: false,
        likesCount: post?.likesCount || 0,
      });
    }

    await Like.create({ postId: postId, userId: userId });
    const post = await Post.findByPk(postId);
    if (post) {
      await post.increment('likesCount');
      await post.reload();
    }
    res.json({
      status: "success",
      liked: true,
      likesCount: post?.likesCount || 1,
    });
  } catch (e) {
    next(e);
  }
};

exports.listByMe = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }

    // استخراج معاملات الشهر والسنة من query parameters
    const { month, year } = req.query;

    // بناء فلتر التاريخ - افتراضياً الشهر الحالي
    let where = { userId: userId };

    // الحصول على التاريخ الحالي
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() يعطي 0-11، لذا نضيف 1
    const currentYear = currentDate.getFullYear();

    // استخدام الشهر والسنة المدخلة أو الحالية كافتراضي
    const targetMonth = month ? parseInt(month) : currentMonth;
    const targetYear = year ? parseInt(year) : currentYear;

    // التحقق من صحة القيم
    if (targetMonth < 1 || targetMonth > 12) {
      const error = new Error(
        "Invalid month. Month should be between 1 and 12"
      );
      error.status = 400;
      throw error;
    }

    if (targetYear < 2020 || targetYear > 2030) {
      const error = new Error(
        "Invalid year. Year should be between 2020 and 2030"
      );
      error.status = 400;
      throw error;
    }

    // إنشاء تاريخ بداية ونهاية الشهر
    const startDate = new Date(targetYear, targetMonth - 1, 1); // بداية الشهر
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999); // نهاية الشهر

    where.createdAt = {
      [sequelize.Op.gte]: startDate,
      [sequelize.Op.lte]: endDate,
    };

    const likes = await Like.findAll({
      where,
      include: [
        {
          model: Post,
          as: 'post',
          where: { isDeleted: false },
          required: false,
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['firstName', 'lastName', 'username', 'image', 'imageUrl', 'isActive']
            }
          ]
        }
      ]
    });

    // After include, filter posts that are not null and have active authors
    const posts = likes
      .map((l) => l.post)
      .filter(
        (post) => post != null && post.user && post.user.isActive !== false
      );

    // إضافة معلومات إضافية في الاستجابة
    const response = {
      status: "success",
      data: posts,
      totalLikes: posts.length,
    };

    // إضافة معلومات الفلترة (دائماً موجودة الآن)
    response.filter = {
      month: targetMonth,
      year: targetYear,
      monthName: new Date(targetYear, targetMonth - 1).toLocaleString("en", {
        month: "long",
      }),
      isDefault: !month || !year, // يوضح إذا كان الشهر افتراضي أم مدخل
    };

    res.json(response);
  } catch (e) {
    next(e);
  }
};
