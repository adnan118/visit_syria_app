/*
ملف وحدة تحكم المهرجانات والأحداث (festivalsEventsController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالفعاليات والمهرجانات
- يتعامل مع إنشاء، قراءة، تحديث، وحذف الفعاليات والمهرجانات
- يربط بين طلبات المستخدم ونموذج الفعاليات والمهرجانات

الوظائف:
- createFestivalEvent     → إنشاء فعالية أو مهرجان جديد
- getAllFestivalsEvents    → عرض جميع الفعاليات والمهرجانات
- getFestivalEventById    → عرض فعالية أو مهرجان محدد
- updateFestivalEvent     → تحديث فعالية أو مهرجان
- deleteFestivalEvent     → حذف فعالية أو مهرجان
*/

// استيراد نموذج الفعاليات والمهرجانات
const { FestivalsEvents } = require('../../models');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات الفعاليات والمهرجانات
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteFestivalEventFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "festivals_events"
    return await deleteMultipleFiles(fileIdentifiers, "festivals_events");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء فعالية أو مهرجان جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createFestivalEvent = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedMedia = [];
  
  try {
    console.log("=== إنشاء فعالية أو مهرجان جديد ===");
    
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

    // إعداد بيانات الفعالية أو المهرجان
    const festivalEventData = {
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
    const newFestivalEvent = await FestivalsEvents.create(festivalEventData);

    console.log(`تم إنشاء الفعالية أو المهرجان بنجاح: ${newFestivalEvent.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Festival or Event created successfully.",
      data: newFestivalEvent
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
          await safeDeleteFestivalEventFiles(filesToDelete);
          console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
        }
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض جميع الفعاليات والمهرجانات
// ---------------------------------------------------------
exports.getAllFestivalsEvents = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 6 فعاليات في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // الحصول على الفعاليات والمهرجانات مع التصفح
    const { count, rows: festivalsEvents } = await FestivalsEvents.findAndCountAll({
      order: [['id', 'ASC']],
      limit,
      offset
    });

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All festivals and events retrieved successfully.",
      count: festivalsEvents.length,
      data: festivalsEvents,
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
// 🔹 عرض فعالية أو مهرجان محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getFestivalEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const festivalEvent = await FestivalsEvents.findByPk(id);

    if (!festivalEvent) {
      const error = new Error('Festival or Event not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Festival or Event found.",
      data: festivalEvent
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث فعالية أو مهرجان (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateFestivalEvent = async (req, res, next) => {
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

    console.log("=== تحديث فعالية أو مهرجان ===");
    console.log("📦 البيانات المستلمة:", req.body);
    console.log("📸 الملفات المرفوعة:", req.dbFiles);

    const festivalEvent = await FestivalsEvents.findByPk(id);
    if (!festivalEvent) {
      if (req.dbFiles && (req.dbFiles.image || req.dbFiles.images || req.dbFiles.videos)) {
        const filesToDelete = [
          ...(req.dbFiles.image || []),
          ...(req.dbFiles.images || []),
          ...(req.dbFiles.videos || []),
        ];
        if (filesToDelete.length > 0) await safeDeleteFestivalEventFiles(filesToDelete);
      }
      const error = new Error("Festival or Event not found.");
      error.status = 404;
      throw error;
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
      placeAr: placeAr || festivalEvent.placeAr,
      placeEn: placeEn || festivalEvent.placeEn,
      latitude: latitude ? parseFloat(latitude) : festivalEvent.latitude,
      longitude: longitude ? parseFloat(longitude) : festivalEvent.longitude,
      dateTime: dateTime ? new Date(dateTime) : festivalEvent.dateTime,
      descriptionAr: descriptionAr || festivalEvent.descriptionAr,
      descriptionEn: descriptionEn || festivalEvent.descriptionEn,
      officialSupporterAr: officialSupporterAr || festivalEvent.officialSupporterAr,
      officialSupporterEn: officialSupporterEn || festivalEvent.officialSupporterEn,
      durationAr: durationAr || festivalEvent.durationAr,
      durationEn: durationEn || festivalEvent.durationEn,
      cost: cost ? parseFloat(cost) : festivalEvent.cost,
      targetAudienceAr: targetAudienceAr || festivalEvent.targetAudienceAr,
      targetAudienceEn: targetAudienceEn || festivalEvent.targetAudienceEn,
      notesAr: notesAr || festivalEvent.notesAr,
      notesEn: notesEn || festivalEvent.notesEn,
      classification: classification || festivalEvent.classification,  // إضافة حقل التصنيف
    };

    // ===========================================================
    // ✅ حذف الصور/الفيديوهات القديمة إذا تم رفع ملفات جديدة
    // ===========================================================
    if (newMedia.length > 0) {
      console.log("📸 الصور/الفيديوهات الجديدة:", newMedia);
      console.log("📸 الصور/الفيديوهات القديمة (خام):", festivalEvent.media);

      let oldMedia = [];
      if (Array.isArray(festivalEvent.media)) oldMedia = [...festivalEvent.media];
      else if (typeof festivalEvent.media === "string") {
        try {
          oldMedia = JSON.parse(festivalEvent.media);
        } catch (e) {
          console.warn("⚠️ تعذر تحليل الصور/الفيديوهات القديمة:", e);
        }
      }

      if (oldMedia.length > 0) {
        try {
          console.log("🗑️ محاولة حذف الصور/الفيديوهات القديمة:", oldMedia);
          await safeDeleteFestivalEventFiles(oldMedia);
        } catch (err) {
          console.error("❌ خطأ أثناء حذف الصور/الفيديوهات القديمة:", err);
        }
      }

      updateData.media = newMedia;
    } else {
      updateData.media = festivalEvent.media || [];
      console.log("📦 الاحتفاظ بالصور/الفيديوهات القديمة:", festivalEvent.media);
    }

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedFestivalEvent = await festivalEvent.update(updateData);

    res.status(200).json({
      status: "success",
      message: "✅ Festival or Event updated successfully.",
      data: updatedFestivalEvent,
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
        await safeDeleteFestivalEventFiles(newMedia);
        console.log("🗑️ تم حذف الصور/الفيديوهات الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور/الفيديوهات الجديدة:", deleteError);
      }
    }

    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف فعالية أو مهرجان (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteFestivalEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const festivalEvent = await FestivalsEvents.findByPk(id);

    if (!festivalEvent) {
      const error = new Error('Festival or Event not found.');
      error.status = 404;
      throw error;
    }

    // 🔹 التحقق من وجود صور/فيديوهات مرتبطة بالفعالية أو المهرجان
    let festivalEventMedia = [];
    if (Array.isArray(festivalEvent.media)) {
      festivalEventMedia = [...festivalEvent.media];
    } else if (typeof festivalEvent.media === "string") {
      try {
        festivalEventMedia = JSON.parse(festivalEvent.media);
      } catch (parseError) {
        festivalEventMedia = [];
      }
    }

    // 🔹 حذف الصور/الفيديوهات القديمة إن وجدت
    if (festivalEventMedia.length > 0) {
      try {
        console.log("🗑️ حذف صور/فيديوهات الفعالية أو المهرجان:", festivalEventMedia);
        await safeDeleteFestivalEventFiles(festivalEventMedia);
      } catch (err) {
        console.error("❌ خطأ في حذف صور/فيديوهات الفعالية أو المهرجان:", err);
      }
    }

    await festivalEvent.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Festival or Event deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
};
