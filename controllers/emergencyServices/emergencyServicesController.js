// استيراد نموذج خدمة الطوارئ
const EmergencyService = require("../../models/emergencyServiceModel");
const { handleUploadError } = require("../services/mediaHelper");
const sequelize = require("../../models/sequelize");

// دالة آمنة لحذف الملفات
const safeDeleteFiles = async (fileIdentifiers = []) => {
  try {
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0)
      return null;
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    return await deleteMultipleFiles(fileIdentifiers, "emergency-services");
  } catch (e) {
    console.error("❌ خطأ في حذف الملفات:", e);
    return null;
  }
};

/**
 * إنشاء خدمة طوارئ جديدة
 */
exports.createEmergencyService = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية إنشاء خدمة طوارئ ===");

    const { titleAr, titleEn, phoneNumber } = req.body;
    const createData = { titleAr, titleEn, phoneNumber };

    // التحقق من وجود صورة
    if (
      req.dbFiles &&
      Array.isArray(req.dbFiles.images) &&
      req.dbFiles.images.length > 0
    ) {
      console.log("تم رفع صورة لخدمة الطوارئ");
      createData.image = req.dbFiles.images[0];
    }

    const newEmergencyService = await EmergencyService.create(createData, {
      transaction,
    });

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    return res.status(201).json({
      status: "success",
      message: "Emergency service created successfully",
      data: newEmergencyService,
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
 * تحديث بيانات خدمة الطوارئ
 */
exports.updateEmergencyService = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية تعديل خدمة طوارئ ===");

    const { id } = req.params;
    const updateData = req.body;

    const existingService = await EmergencyService.findByPk(id, {
      transaction,
    });
    if (!existingService) {
      const error = new Error("Emergency service not found");
      error.status = 404;
      throw error;
    }

    let oldImageToDelete = null;

    if (
      req.dbFiles &&
      Array.isArray(req.dbFiles.images) &&
      req.dbFiles.images.length > 0
    ) {
      console.log("تم رفع صورة جديدة لخدمة الطوارئ");

      if (existingService.image) {
        oldImageToDelete = existingService.image;
        console.log("الصورة القديمة المراد حذفها:", oldImageToDelete);
      }

      updateData.image = req.dbFiles.images[0];
    }

    const updatedService = await existingService.update(
      { ...updateData, updatedAt: new Date() },
      { transaction }
    );

    if (oldImageToDelete) {
      try {
        await safeDeleteFiles([oldImageToDelete]);
      } catch (err) {
        console.error("❌ خطأ في حذف صورة خدمة الطوارئ القديمة:", err);
      }
    }

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: "Emergency service updated successfully",
      data: updatedService,
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
 * عرض جميع خدمات الطوارئ
 */
exports.getAllEmergencyServices = async function (req, res, next) {
  try {
    const emergencyServices = await EmergencyService.findAll({
      order: [["createdAt", "DESC"]],
    });

    return res.status(200).json({
      status: "success",
      data: emergencyServices,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * عرض خدمة طوارئ محددة
 */
exports.getEmergencyService = async function (req, res, next) {
  try {
    const { id } = req.params;

    const emergencyService = await EmergencyService.findByPk(id);

    if (!emergencyService) {
      const error = new Error("Emergency service not found");
      error.status = 404;
      throw error;
    }

    return res.status(200).json({
      status: "success",
      data: emergencyService,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * حذف خدمة طوارئ وصورتها
 */
exports.deleteEmergencyService = async function (req, res, next) {
  // بدء عملية قاعدة بيانات معاملية
  const transaction = await sequelize.transaction();
  try {
    console.log("=== بدء عملية حذف خدمة طوارئ ===");

    const { id } = req.params;

    const serviceToDelete = await EmergencyService.findByPk(id, {
      transaction,
    });
    if (!serviceToDelete) {
      const error = new Error("Emergency service not found");
      error.status = 404;
      throw error;
    }

    // حذف الخدمة من قاعدة البيانات
    await EmergencyService.destroy({ where: { id }, transaction });

    if (serviceToDelete.image) {
      try {
        await safeDeleteFiles([serviceToDelete.image]);
        console.log(
          "✅ تم حذف صورة خدمة الطوارئ من النظام:",
          serviceToDelete.image
        );
      } catch (err) {
        console.error("❌ خطأ في حذف صورة خدمة الطوارئ:", err);
      }
    }

    // إنهاء المعاملة (تأكيد جميع التغييرات)
    await transaction.commit();

    return res.status(200).json({
      status: "success",
      message: "Emergency service deleted successfully",
    });
  } catch (error) {
    // التراجع عن المعاملة في حالة الخطأ
    await transaction.rollback();
    console.error("Error in deleteEmergencyService:", error);
    next(error);
  }
};