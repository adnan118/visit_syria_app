// controllers/saves/saves.js
// إدارة الحفظ (Save/Unsave)

const { Save, Post, User } = require("../../models");

exports.toggle = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    const { postId } = req.params;
    const found = await Save.findOne({ 
      where: { 
        postId: postId, 
        userId: userId 
      } 
    });
    
    if (found) {
      await found.destroy();
      return res.json({ status: "success", saved: false });
    }
    
    await Save.create({ postId: postId, userId: userId });
    res.json({ status: "success", saved: true });
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
    
    const saves = await Save.findAll({
      where: { userId: userId },
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
              attributes: ['firstName', 'lastName', 'username', 'image', 'isActive'], // Removed imageUrl since it's a virtual field
              where: { isActive: true },
              required: false
            }
          ]
        }
      ]
    });

    // فلترة النتائج لإزالة المنشورات التي لم تعد موجودة أو من مؤلفين غير نشطين
    const validSaves = saves.filter((save) => save.post && save.post.user);

    res.json({ status: "success", data: validSaves.map((s) => s.post) });
  } catch (e) {
    next(e);
  }
};





[{"type":"video","file":"compressed-ex2-1758432804423-1761988226944.mp4"}]