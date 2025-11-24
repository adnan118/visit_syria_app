/*
 --------------------------------
- هذا الملف يحتوي على جميع الدوال الخاصة بإدارة النظام
- اللوجيك: إدارة المستخدمين، الفئات، المنتجات، الطلبات
- التعامل مع الأخطاء: استخدام نمط try-catch مع تمرير الأخطاء لمعالج الأخطاء العام
*/

// استيراد النماذج المطلوبة
const User = require("../../models/userModel");
const Token = require("../../models/tokenModel");
const sequelize = require("../../models/sequelize");

// ==================== دوال إدارة المستخدمين ====================

/**
 * تحديث بيانات المستخدم (للإدارة)
 */
exports.updateUser = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية تعديل مستخدم (الإدارة) ===");
    console.log("Request params:", req.params);
    console.log("Request body:", req.body);

    const { id } = req.params;
    const updateData = req.body;

    // منع المستخدم من تعديل نفسه
    if (req.auth.id == id) {  // Changed from === to == to handle type conversion
      // السماح بتعديل البيانات الشخصية ولكن ليس الصلاحيات
      delete updateData.isAdmin;
      delete updateData.isActive;
      console.log("User is editing themselves, removed admin/active flags");
    }

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
        const { deleteMultipleFiles } = require("../../controllers/services/mediaHelper");
        await deleteMultipleFiles([oldImageToDelete], "users");
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
      const { handleUploadError } = require("../../controllers/services/mediaHelper");
      const errorResponse = handleUploadError(error);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }

    next(error);
  }
};

/**
 * عرض جميع المستخدمين (للإدارة)
 */
exports.getAllUsers = async function (req, res, next) {
  try {
    // الحصول على معلمات التصفح
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    // الحصول على عامل الترتيب
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 'ASC' : 'DESC';
    
    // بناء شروط البحث إذا وُجدت
    let where = {};
    
    // البحث حسب الكلمات المفتاحية
    if (req.query.search) {
      where = {
        [sequelize.Op.or]: [
          { firstName: { [sequelize.Op.like]: `%${req.query.search}%` } },
          { lastName: { [sequelize.Op.like]: `%${req.query.search}%` } },
          { username: { [sequelize.Op.like]: `%${req.query.search}%` } },
          { email: { [sequelize.Op.like]: `%${req.query.search}%` } },
          { mobile: { [sequelize.Op.like]: `%${req.query.search}%` } }
        ]
      };
    }
    
    // تصفية حسب حالة الحساب
    if (req.query.isActive !== undefined) {
      where.isActive = req.query.isActive === 'true';
    }
    
    // تصفية حسب كون المستخدم مديراً
    if (req.query.isAdmin !== undefined) {
      where.isAdmin = req.query.isAdmin === 'true';
    }
    
    // الحصول على المستخدمين مع التصفح
    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      order: [[sortBy, sortOrder]],
      offset,
      limit,
      attributes: { exclude: ['passwordHash'] }
    });
      
    // الحصول على العدد الإجمالي
    // الحصول على عدد الإداريين والمستخدمين العاديين
    const adminUsersCount = await User.count({ where: { isAdmin: true } });
    const regularUsersCount = await User.count({ where: { isAdmin: false } });
    
    // Convert users to plain objects
    const plainUsers = users.map(user => user.get({ plain: true }));
    
    return res.status(200).json({
      status: "success",
      message: "Users retrieved successfully",
      data: {
        users: plainUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        userCounts: {
          admins: adminUsersCount,
          regularUsers: regularUsersCount,
          total: adminUsersCount + regularUsersCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض مستخدم محدد حسب المعرف (للإدارة)
 */
exports.getUserById = async function (req, res, next) {
  try {
    const { id } = req.params;
    
    // التحقق من صحة المعرف
    if (!id.match(/^[0-9]+$/)) {
      const error = new Error("Invalid user ID format");
      error.status = 400;
      throw error;
    }
    
    const user = await User.findByPk(id, {
      attributes: { exclude: ['passwordHash'] }
    });
    
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    const userData = user.get({ plain: true });
    
    return res.status(200).json({
      status: "success",
      message: "User retrieved successfully",
      data: userData
    });
  } catch (error) {
    next(error);
  }
};

/**
 * حذف مستخدم (للإدارة)
 */
exports.deleteUser = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    const { id } = req.params;

    // البحث عن المستخدم
    const user = await User.findByPk(id, { transaction });
    if (!user) {
      const error = new Error("User not found");
      error.status = 404;
      throw error;
    }
    
    // منع حذف المستخدم الإداري نفسه
    if (user.isAdmin && req.auth.id === user.id) {
      const error = new Error("You cannot delete yourself as an admin");
      error.status = 400;
      throw error;
    }

    // حذف التوكنات المرتبطة بالمستخدم
    await Token.destroy({ where: { userId: id }, transaction });
    
    // حذف المستخدم
    await User.destroy({ where: { id }, transaction });

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: "User deleted successfully"
    });
  } catch (error) {
    // التراجع عن المعاملة في حالة الخطأ
    await transaction.rollback();
    next(error);
  }
};