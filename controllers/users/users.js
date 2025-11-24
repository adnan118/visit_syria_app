// استيراد نموذج المستخدم
const User = require("../../models/userModel");
const { handleUploadError } = require("../services/mediaHelper");
const sequelize = require("../../models/sequelize");

// دالة آمنة لحذف الملفات
const safeDeleteFiles = async (fileIdentifiers = []) => {
  try {
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0)
      return null;
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    return await deleteMultipleFiles(fileIdentifiers, "users");
  } catch (e) {
    console.error("❌ خطأ في حذف الملفات:", e);
    return null;
  }
};

/**
 * تحديث بيانات المستخدم
 */
exports.updateUser = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية تعديل مستخدم ===");

    const { id } = req.params;
    const updateData = req.body;

    const existingUser = await User.findByPk(id, { transaction });
    if (!existingUser) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    let oldImageToDelete = null;

    if (
      req.dbFiles &&
      Array.isArray(req.dbFiles.image) &&
      req.dbFiles.image.length > 0
    ) {
      console.log("تم رفع صورة جديدة للمستخدم");

      if (existingUser.image) {
        oldImageToDelete = existingUser.image;
        console.log("الصورة القديمة المراد حذفها:", oldImageToDelete);
      }

      updateData.image = req.dbFiles.image[0];
    }

    if (req.body.isActive !== undefined) {
      updateData.isActive = req.body.isActive;
    }

    if (req.body.isAdmin !== undefined) {
      updateData.isAdmin = req.body.isAdmin;
    }

    const updatedUser = await existingUser.update(
      { ...updateData, updatedAt: new Date() },
      { transaction }
    );

    if (oldImageToDelete && oldImageToDelete !== "default-user.png") {
      try {
        await safeDeleteFiles([oldImageToDelete]);
      } catch (err) {
        console.error("❌ خطأ في حذف صورة المستخدم القديمة:", err);
      }
    }

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    // Remove sensitive data
    const userObj = updatedUser.get({ plain: true });
    delete userObj.passwordHash;

    return res.status(200).json({
      status: "success",
      message: "User updated successfully",
      data: userObj,
    });
  } catch (error) {
    // التراجع عن المعاملة في حالة الخطأ
    await transaction.rollback();
    
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      const errorResponse = handleUploadError(error);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }

    next(error);
  }
};

/**
 * عرض ملف شخصي عام (للجميع) باستخدام ID أو Username
 */
exports.getProfile = async function (req, res, next) {
  try {
    const { id } = req.params;

    // التحقق إذا كان ID أم username
    let user;
    if (id.match(/^[0-9]+$/)) {
      // ID صحيح
      user = await User.findByPk(id);
    } else {
      // username
      user = await User.findOne({ where: { username: id } });
    }

    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // إذا كان المستخدم معطل، يمكن إخفاء بعض التفاصيل أو إظهار رسالة
    if (user.isDeactivated) {
      return res.status(200).json({
        status: "success",
        data: {
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          image: user.image,
          imageUrl: user.imageUrl,
          bio: user.bio,
          isDeactivated: true,
          message: "This account is temporarily deactivated",
        },
      });
    }

    const userData = user.get({ plain: true });
    
    res.status(200).json({
      status: "success",
      data: userData,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * حذف مستخدم وصورته
 */
exports.deleteUser = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية حذف مستخدم ===");

    const { id } = req.params;

    const userToDelete = await User.findByPk(id, { transaction });
    if (!userToDelete) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }

    // حذف المستخدم من قاعدة البيانات
    await User.destroy({ where: { id }, transaction });
    
    if (
      userToDelete.image &&
      userToDelete.image !== "default-user.png"
    ) {
      try {
        await safeDeleteFiles([userToDelete.image]);
        console.log("✅ تم حذف صورة المستخدم من النظام:", userToDelete.image);
      } catch (err) {
        console.error("❌ خطأ في حذف صورة المستخدم:", err);
      }
    }

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully"
    });
  } catch (error) {
    // التراجع عن المعاملة في حالة الخطأ
    await transaction.rollback();
    console.error("Error in deleteUser:", error);
    next(error);
  }
};