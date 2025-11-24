/*
ملف وحدة تحكم المعارض (exhibitionsController.js)
-------------------------------------
وظيفة الملف:
- يحتوي على منطق الأعمال لعمليات المعارض
- يتعامل مع قاعدة البيانات عبر النموذج المناسب
- يعالج طلبات المستخدمين والإداريين
*/

// استيراد النموذج المناسب
const { Exhibitions } = require("../../models");

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات المعارض
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteExhibitionFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "exhibitions"
    return await deleteMultipleFiles(fileIdentifiers, "exhibitions");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// دالة لجلب جميع المعارض
exports.getAllExhibitions = async (req, res, next) => {
  try {
    const exhibitions = await Exhibitions.findAll({
      order: [["dateTime", "DESC"]],
    });
    res.status(200).json({
      status: "success",
      results: exhibitions.length,
      data: {
        exhibitions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// دالة لجلب معرض محدد
exports.getExhibitionById = async (req, res, next) => {
  try {
    const exhibition = await Exhibitions.findByPk(req.params.id);
    if (!exhibition) {
      const error = new Error("المعرض غير موجود");
      error.status = 404;
      throw error;
    }
    res.status(200).json({
      status: "success",
      data: {
        exhibition,
      },
    });

  } catch (error) {
    next(error);
  }
};

// دالة لإنشاء معرض جديد (للإداريين فقط)
exports.createExhibition = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedMedia = [];
  
  try {
    console.log("=== إنشاء معرض جديد ===");
    
    const { 
      placeAr,
      placeEn,
      latitude, 
      longitude, 
      dateTime, 
      descriptionAr,
      descriptionEn,
      officialSupporterAr,
      officialSupporterEn,
      durationAr,
      durationEn,
      cost, 
      targetAudienceAr,
      targetAudienceEn,
      notesAr,
      notesEn,
      classification  // إضافة حقل التصنيف
    } = req.body;

    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    // التحقق من وجود صور/فيديوهات مرفوعة وحفظها مؤقتًا
    if (req.dbFiles) {
      console.log("معالجة ملفات الصور/الفيديوهات المرفوعة:", req.dbFiles);
      
      // Handle single image upload (from 'image' field)
      if (req.dbFiles.image && Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
        uploadedMedia = [...req.dbFiles.image]; // Create a copy
        console.log("الصور/الفيديوهات (مفردة):", uploadedMedia);
      }
      // Handle multiple images upload (from 'images' field)
      else if (req.dbFiles.images && Array.isArray(req.dbFiles.images) && req.dbFiles.images.length > 0) {
        uploadedMedia = [...req.dbFiles.images]; // Create a copy
        console.log("الصور/الفيديوهات (متعددة):", uploadedMedia);
      }
      // Handle videos upload
      else if (req.dbFiles.videos && Array.isArray(req.dbFiles.videos) && req.dbFiles.videos.length > 0) {
        uploadedMedia = [...req.dbFiles.videos]; // Create a copy
        console.log("الفيديوهات:", uploadedMedia);
      }
    }

    // التحقق من الحقول المطلوبة
    if (!placeAr || !placeEn || !latitude || !longitude || !dateTime || !descriptionAr || !descriptionEn) {
      const error = new Error('Please provide placeAr, placeEn, latitude, longitude, dateTime, descriptionAr, and descriptionEn.');
      error.status = 400;
      throw error;
    }

    // إعداد بيانات المعرض
    const exhibitionData = {
      placeAr,
      placeEn,
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      dateTime: new Date(dateTime),
      descriptionAr,
      descriptionEn,
      media: uploadedMedia, // استخدام الصور/الفيديوهات المرفوعة
      officialSupporterAr,
      officialSupporterEn,
      durationAr,
      durationEn,
      cost: cost ? parseFloat(cost) : null,
      targetAudienceAr,
      targetAudienceEn,
      notesAr,
      notesEn,
      classification  // إضافة حقل التصنيف
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newExhibition = await Exhibitions.create(exhibitionData);

    console.log(`تم إنشاء المعرض بنجاح: ${newExhibition.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Exhibition created successfully.",
      data: newExhibition
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
    if (uploadedMedia && uploadedMedia.length > 0) {
      try {
        // حذف الملفات المرفوعة
        const filesToDelete = [];
        if (Array.isArray(uploadedMedia)) {
          filesToDelete.push(...uploadedMedia);
        } else if (typeof uploadedMedia === 'string') {
          filesToDelete.push(uploadedMedia);
        }
        
        if (filesToDelete.length > 0) {
          await safeDeleteExhibitionFiles(filesToDelete);
          console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
        }
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// دالة لتحديث معرض (للإداريين فقط)
exports.updateExhibition = async (req, res, next) => {
  let newMedia = [];

  try {
    const { id } = req.params;
    const {
      placeAr,
      placeEn,
      latitude,
      longitude,
      dateTime,
      descriptionAr,
      descriptionEn,
      officialSupporterAr,
      officialSupporterEn,
      durationAr,
      durationEn,
      cost,
      targetAudienceAr,
      targetAudienceEn,
      notesAr,
      notesEn,
      classification,  // إضافة حقل التصنيف
    } = req.body;

    console.log("=== تحديث معرض ===");
    console.log("📦 البيانات المستلمة:", req.body);
    console.log("📸 الملفات المرفوعة:", req.dbFiles);

    const exhibition = await Exhibitions.findByPk(id);
    if (!exhibition) {
      // إذا كان هناك ملفات مرفوعة، قم بحذفها أولاً
      if (req.dbFiles && (req.dbFiles.image || req.dbFiles.images || req.dbFiles.videos)) {
        const filesToDelete = [
          ...(req.dbFiles.image || []),
          ...(req.dbFiles.images || []),
          ...(req.dbFiles.videos || []),
        ];
        if (filesToDelete.length > 0) await safeDeleteExhibitionFiles(filesToDelete);
      }
      return res.status(404).json({
        status: "failure",
        message: "المعرض غير موجود",
      });
      
    }

    // 🔹 تحديد الصور/الفيديوهات الجديدة المرفوعة إن وجدت
    if (req.dbFiles) {
      if (Array.isArray(req.dbFiles.images)) newMedia = [...req.dbFiles.images];
      else if (typeof req.dbFiles.images === "string") newMedia = [req.dbFiles.images];
      else if (Array.isArray(req.dbFiles.image)) newMedia = [...req.dbFiles.image];
      else if (typeof req.dbFiles.image === "string") newMedia = [req.dbFiles.image];
      else if (Array.isArray(req.dbFiles.videos)) newMedia = [...req.dbFiles.videos];
      else if (typeof req.dbFiles.videos === "string") newMedia = [req.dbFiles.videos];
    }

    // 🔹 تحضير بيانات التحديث
    const updateData = {
      placeAr: placeAr || exhibition.placeAr,
      placeEn: placeEn || exhibition.placeEn,
      latitude: latitude ? parseFloat(latitude) : exhibition.latitude,
      longitude: longitude ? parseFloat(longitude) : exhibition.longitude,
      dateTime: dateTime ? new Date(dateTime) : exhibition.dateTime,
      descriptionAr: descriptionAr || exhibition.descriptionAr,
      descriptionEn: descriptionEn || exhibition.descriptionEn,
      officialSupporterAr: officialSupporterAr || exhibition.officialSupporterAr,
      officialSupporterEn: officialSupporterEn || exhibition.officialSupporterEn,
      durationAr: durationAr || exhibition.durationAr,
      durationEn: durationEn || exhibition.durationEn,
      cost: cost ? parseFloat(cost) : exhibition.cost,
      targetAudienceAr: targetAudienceAr || exhibition.targetAudienceAr,
      targetAudienceEn: targetAudienceEn || exhibition.targetAudienceEn,
      notesAr: notesAr || exhibition.notesAr,
      notesEn: notesEn || exhibition.notesEn,
      classification: classification || exhibition.classification,  // إضافة حقل التصنيف
    };

    // ===========================================================
    // ✅ حذف الصور/الفيديوهات القديمة إذا تم رفع ملفات جديدة
    // ===========================================================
    if (newMedia.length > 0) {
      console.log("📸 الصور/الفيديوهات الجديدة:", newMedia);
      console.log("📸 الصور/الفيديوهات القديمة (خام):", exhibition.media);

      let oldMedia = [];
      if (Array.isArray(exhibition.media)) oldMedia = [...exhibition.media];
      else if (typeof exhibition.media === "string") {
        try {
          oldMedia = JSON.parse(exhibition.media);
        } catch (e) {
          console.warn("⚠️ تعذر تحليل الصور/الفيديوهات القديمة:", e);
        }
      }

      if (oldMedia.length > 0) {
        try {
          console.log("🗑️ محاولة حذف الصور/الفيديوهات القديمة:", oldMedia);
          await safeDeleteExhibitionFiles(oldMedia);
        } catch (err) {
          console.error("❌ خطأ أثناء حذف الصور/الفيديوهات القديمة:", err);
        }
      }

      updateData.media = newMedia;
    } else {
      updateData.media = exhibition.media || [];
      console.log("📦 الاحتفاظ بالصور/الفيديوهات القديمة:", exhibition.media);
    }

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedExhibition = await exhibition.update(updateData);

    res.status(200).json({
      status: "success",
      message: "✅ Exhibition updated successfully.",
      data: updatedExhibition,
    });

  } catch (error) {
    // التعامل مع أخطاء رفع الملفات
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      const errorResponse = handleUploadError(error);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }

    // حذف الصور/الفيديوهات الجديدة المرفوعة في حال حدوث خطأ
    if (newMedia.length > 0) {
      try {
        await safeDeleteExhibitionFiles(newMedia);
        console.log("🗑️ تم حذف الصور/الفيديوهات الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور/الفيديوهات الجديدة:", deleteError);
      }
    }

    res.status(500).json({
      status: "error",
      message: "حدث خطأ أثناء تحديث المعرض",
      error: error.message,
    });
  }
};

// دالة لحذف معرض (للإداريين فقط)
exports.deleteExhibition = async (req, res, next) => {
  try {
    const exhibition = await Exhibitions.findByPk(req.params.id);
    if (!exhibition) {
      const error = new Error("Exhibition not found");
      error.status = 404;
      throw error;
    }

    // 🔹 التحقق من وجود صور/فيديوهات مرتبطة بالمعرض
    let exhibitionMedia = [];
    if (Array.isArray(exhibition.media)) {
      exhibitionMedia = [...exhibition.media];
    } else if (typeof exhibition.media === "string") {
      try {
        exhibitionMedia = JSON.parse(exhibition.media);
      } catch (parseError) {
        exhibitionMedia = [];
      }
    }

    // 🔹 حذف الصور/الفيديوهات القديمة إن وجدت
    if (exhibitionMedia.length > 0) {
      try {
        console.log("🗑️ حذف صور/فيديوهات المعرض:", exhibitionMedia);
        await safeDeleteExhibitionFiles(exhibitionMedia);
      } catch (err) {
        console.error("❌ خطأ في حذف صور/فيديوهات المعرض:", err);
      }
    }

    await exhibition.destroy();

    res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};
