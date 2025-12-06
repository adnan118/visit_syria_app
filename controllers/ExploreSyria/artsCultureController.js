/*
ملف وحدة تحكم الفنون والثقافة (artsCultureController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالفنون والثقافة
- يتعامل مع إنشاء، قراءة، تحديث، وحذف الفنون والثقافة
- يربط بين طلبات المستخدم ونموذج الفنون والثقافة

الوظائف:
- createArtsCulture     → إنشاء سجل فنون وثقافة جديد
- getAllArtsCulture     → عرض جميع سجلات الفنون والثقافة
- getArtsCultureById    → عرض سجل فنون وثقافة محدد
- updateArtsCulture     → تحديث سجل فنون وثقافة
- deleteArtsCulture     → حذف سجل فنون وثقافة
*/

// استيراد نموذج الفنون والثقافة
const ArtsCulture = require('../../models/artsCultureModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات الفنون والثقافة
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteArtsCultureFiles = async (fileIdentifiers = []) => {
  try {
    // التحقق من أن المعرفات مصفوفة وليست فارغة
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0) {
      return null;
    }
    
    // التحقق من أن جميع العناصر عبارة عن سلاسل نصية
    for (let i = 0; i < fileIdentifiers.length; i++) {
      // التحقق من أن العنصر هو سلسلة نصية
      if (typeof fileIdentifiers[i] !== 'string') {
        return null;
      }
    }
    
    // استيراد دالة حذف ملفات متعددة
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    
    // حذف الملفات بإدخال نوع المحتوى "arts_culture"
    return await deleteMultipleFiles(fileIdentifiers, "arts_culture");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء سجل فنون وثقافة جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createArtsCulture = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImage = null;
  
  try {
    console.log("=== إنشاء سجل فنون وثقافة جديد ===");
    
    const { name_ar, name_en, description_ar, description_en, latitude, longitude } = req.body;

    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    // التحقق من وجود صورة مرفوعة وحفظها مؤقتًا
    if (req.dbFiles && req.dbFiles.image) {
      console.log("معالجة الصورة المرفوعة:", req.dbFiles.image);
      // التحقق مما إذا كانت الصورة مصفوفة و lấy العنصر الأول
      if (Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
        uploadedImage = req.dbFiles.image[0];
      } else if (typeof req.dbFiles.image === 'string') {
        uploadedImage = req.dbFiles.image;
      }
    }

    // التحقق من الحقول المطلوبة
    if (!name_ar || !name_en || !description_ar || !description_en) {
      const error = new Error('Please provide all required fields: name_ar, name_en, description_ar, description_en.');
      error.status = 400;
      throw error;
    }

    // إعداد بيانات الفنون والثقافة
    const artsCultureData = {
      name_ar,
      name_en,
      description_ar,
      description_en,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      image: uploadedImage // استخدام الصورة المرفوعة
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newArtsCulture = await ArtsCulture.create(artsCultureData);

    console.log(`تم إنشاء سجل الفنون والثقافة بنجاح: ${newArtsCulture.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Arts and Culture record created successfully.",
      data: newArtsCulture
    });
  } catch (error) {
    // التحقق من أن الخطأ متعلق برفع الملفات
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      // معالجة خطأ رفع الملفات
      const errorResponse = handleUploadError(error);
      // إرجاع استجابة الخطأ
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // إذا حدث خطأ في أي مرحلة، حذف الملفات المرفوعة
    if (uploadedImage) {
      try {
        await safeDeleteArtsCultureFiles([uploadedImage]);
        console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض جميع سجلات الفنون والثقافة
// ---------------------------------------------------------
exports.getAllArtsCulture = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 سجلات في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // الحصول على السجلات مع التصفح
    const { count, rows: artsCulture } = await ArtsCulture.findAndCountAll({
      order: [['id', 'ASC']],
      limit,
      offset
    });

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All Arts and Culture records retrieved successfully.",
      count: artsCulture.length,
      data: artsCulture,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit
      }
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض سجل فنون وثقافة محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getArtsCultureById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const artsCulture = await ArtsCulture.findByPk(id);

    if (!artsCulture) {
      const error = new Error('Arts and Culture record not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Arts and Culture record found.",
      data: artsCulture
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث سجل فنون وثقافة (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateArtsCulture = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let newImage = null;
  
  try {
    const { id } = req.params;
    const { name_ar, name_en, description_ar, description_en, latitude, longitude } = req.body;

    const artsCulture = await ArtsCulture.findByPk(id);
    if (!artsCulture) {
      // حذف الملفات الجديدة إذا تم رفعها
      if (req.dbFiles && req.dbFiles.image) {
        await safeDeleteArtsCultureFiles([req.dbFiles.image]);
      }
      const error = new Error('Arts and Culture record not found.');
      error.status = 404;
      throw error;
    }

    // التحقق من وجود صورة مرفوعة وحفظها مؤقتًا
    if (req.dbFiles && req.dbFiles.image) {
      // التحقق مما إذا كانت الصورة مصفوفة و lấy العنصر الأول
      if (Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
        newImage = req.dbFiles.image[0];
      } else if (typeof req.dbFiles.image === 'string') {
        newImage = req.dbFiles.image;
      }
    }

    // إعداد بيانات التحديث
    const updateData = {
      name_ar,
      name_en,
      description_ar,
      description_en,
      latitude: latitude ? parseFloat(latitude) : artsCulture.latitude,
      longitude: longitude ? parseFloat(longitude) : artsCulture.longitude
    };

    // إذا تم رفع صورة جديدة
    if (req.dbFiles && req.dbFiles.image) {
      // حذف الصورة القديمة إذا كانت موجودة
      if (artsCulture.image) {
        await safeDeleteArtsCultureFiles([artsCulture.image]);
      }
      // تعيين الصورة الجديدة
      updateData.image = newImage;
    }

    // تحديث البيانات
    const updatedArtsCulture = await artsCulture.update(updateData);

    res.status(200).json({
      status: "success",
      message: "✅ Arts and Culture record updated successfully.",
      data: updatedArtsCulture
    });
  } catch (error) {
    // التحقق من أن الخطأ متعلق برفع الملفات
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      // معالجة خطأ رفع الملفات
      const errorResponse = handleUploadError(error);
      // إرجاع استجابة الخطأ
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // إذا حدث خطأ في أي مرحلة، حذف الملفات المرفوعة الجديدة
    if (newImage) {
      try {
        await safeDeleteArtsCultureFiles([newImage]);
        console.log('تم حذف الملفات المرفوعة الجديدة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة الجديدة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف سجل فنون وثقافة (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteArtsCulture = async (req, res, next) => {
  try {
    const { id } = req.params;

    const artsCulture = await ArtsCulture.findByPk(id);
    if (!artsCulture) {
      return res.status(404).json({
        status: "failure",
        message: "Arts and Culture record not found.",
      });
    }

    // حذف صورة السجل إذا كانت موجودة
    if (artsCulture.image) {
      try {
        // حذف صورة السجل من النظام
        await safeDeleteArtsCultureFiles([artsCulture.image]);
      } catch (err) {
        // طباعة رسالة خطأ في الكونسول
        console.error("❌ خطأ في حذف صورة السجل:", err);
      }
    }

    await artsCulture.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Arts and Culture record deleted successfully."
    });
  } catch (error) {
    console.error('Error in deleteArtsCulture:', error);
    next(error);
  }
};