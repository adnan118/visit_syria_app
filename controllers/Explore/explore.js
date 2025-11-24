/*
ملف وحدة تحكم Explore (explore.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة ب Explore
- يتعامل مع إنشاء، قراءة، تحديث، وحذف Explore
- يربط بين طلبات المستخدم ونموذج Explore
*/

// استيراد نموذج Explore
const Explore = require('../../models/exploreModel');

// استيراد نموذج المدينة
const City = require('../../models/cityModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات Explore
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteExploreFiles = async (fileIdentifiers = []) => {
  try {
    console.log("محاولة حذف الملفات:", fileIdentifiers);
    
    // التحقق من أن المعرفات مصفوفة وليست فارغة
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0) {
      console.log("لا توجد ملفات لحذفها");
      return {
        success: true,
        message: "No files to delete",
        data: {
          totalFiles: 0,
          deletedCount: 0,
          failedCount: 0
        }
      };
    }
    
    // التحقق من أن جميع العناصر عبارة عن سلاسل نصية
    for (let i = 0; i < fileIdentifiers.length; i++) {
      // التحقق من أن العنصر هو سلسلة نصية
      if (typeof fileIdentifiers[i] !== 'string') {
        console.log("عنصر غير نصي في المصفوفة:", fileIdentifiers[i]);
        return {
          success: false,
          message: "Invalid file identifier type",
          error: "File identifiers must be strings"
        };
      }
    }
    
    // استيراد دالة حذف ملفات متعددة
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    
    console.log("استدعاء دالة حذف الملفات مع نوع المحتوى: explore");
    // حذف الملفات بإدخال نوع المحتوى "explore"
    const result = await deleteMultipleFiles(fileIdentifiers, "explore");
    console.log("نتيجة حذف الملفات:", result);
    return result;
  } catch (e) {
    console.error("خطأ في دالة حذف الملفات:", e);
    // العودة بنتيجة فشل في حالة الخطأ
    return {
      success: false,
      message: "Error deleting files",
      error: e.message
    };
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء سجل Explore جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createExplore = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء سجل Explore جديد ===");
    
    const { name_ar, name_en, cityId, description_ar, description_en, socialLinks, latitude, longitude, phoneNumbers, openingHours, workingDays } = req.body;

    console.log("البيانات المستلمة:", req.body);
    console.log("نوع socialLinks:", typeof socialLinks, "القيمة:", socialLinks);
    console.log("نوع phoneNumbers:", typeof phoneNumbers, "القيمة:", phoneNumbers);
    console.log("الملفات المرفوعة:", req.dbFiles);

    // التحقق من وجود صور مرفوعة وحفظها مؤقتًا
    if (req.dbFiles && req.dbFiles.images) {
      console.log("معالجة الصور المرفوعة:", req.dbFiles.images);
      if (Array.isArray(req.dbFiles.images)) {
        uploadedImages = req.dbFiles.images;
      } else if (typeof req.dbFiles.images === 'string') {
        uploadedImages = [req.dbFiles.images];
      }
    }

    // التحقق من الحقول المطلوبة
    if (!name_ar || !name_en || !cityId || !description_ar || !description_en || !latitude || !longitude || !phoneNumbers || !openingHours || !workingDays) {
      const error = new Error('Please provide all required fields: name_ar, name_en, cityId, description_ar, description_en, latitude, longitude, phoneNumbers, openingHours, workingDays.');
      error.status = 400;
      throw error;
    }

    // التحقق من وجود المدينة
    const city = await City.findByPk(cityId);
    if (!city) {
      const error = new Error('City not found.');
      error.status = 404;
      throw error;
    }

    // معالجة روابط التواصل الاجتماعي إذا تم توفيرها
    let parsedSocialLinks = [];
    if (socialLinks) {
      try {
        // إذا كانت socialLinks مصفوفة بالفعل، استخدمها كما هي
        if (Array.isArray(socialLinks)) {
          parsedSocialLinks = socialLinks;
        } 
        // إذا كانت socialLinks نص JSON، حاول تحليلها
        else if (typeof socialLinks === 'string') {
          // تحقق مما إذا كانت تمثل مصفوفة JSON
          if (socialLinks.startsWith('[') && socialLinks.endsWith(']')) {
            parsedSocialLinks = JSON.parse(socialLinks);
          } 
          // إذا كانت تمثل كائن JSON واحد
          else if (socialLinks.startsWith('{') && socialLinks.endsWith('}')) {
            parsedSocialLinks = [JSON.parse(socialLinks)];
          }
          // إذا كانت قائمة مفصولة بفواصل
          else if (socialLinks.includes(',')) {
            parsedSocialLinks = socialLinks.split(',').map(link => link.trim());
          }
          // إذا كانت قيمة واحدة
          else {
            parsedSocialLinks = [socialLinks];
          }
        }
        // إذا كانت socialLinks كائن، حولها إلى مصفوفة
        else if (typeof socialLinks === 'object') {
          parsedSocialLinks = [socialLinks];
        }
      } catch (e) {
        console.log("خطأ في تحليل socialLinks:", e);
        // إذا فشل التحليل، استخدم مصفوفة فارغة
        parsedSocialLinks = [];
      }
    }

    // معالجة أرقام الهواتف إذا تم توفيرها
    let parsedPhoneNumbers = [];
    if (phoneNumbers) {
      try {
        // إذا كانت phoneNumbers مصفوفة بالفعل، استخدمها كما هي
        if (Array.isArray(phoneNumbers)) {
          parsedPhoneNumbers = phoneNumbers;
        } 
        // إذا كانت phoneNumbers نص JSON، حاول تحليلها
        else if (typeof phoneNumbers === 'string') {
          // تحقق مما إذا كانت تمثل مصفوفة JSON
          if (phoneNumbers.startsWith('[') && phoneNumbers.endsWith(']')) {
            parsedPhoneNumbers = JSON.parse(phoneNumbers);
          } 
          // إذا كانت تمثل كائن JSON واحد
          else if (phoneNumbers.startsWith('{') && phoneNumbers.endsWith('}')) {
            parsedPhoneNumbers = [JSON.parse(phoneNumbers)];
          }
          // إذا كانت قائمة مفصولة بفواصل
          else if (phoneNumbers.includes(',')) {
            parsedPhoneNumbers = phoneNumbers.split(',').map(number => number.trim());
          }
          // إذا كانت قيمة واحدة
          else {
            parsedPhoneNumbers = [phoneNumbers];
          }
        }
        // إذا كانت phoneNumbers كائن، حولها إلى مصفوفة
        else if (typeof phoneNumbers === 'object') {
          parsedPhoneNumbers = [phoneNumbers];
        }
      } catch (e) {
        console.log("خطأ في تحليل phoneNumbers:", e);
        // إذا فشل التحليل، استخدم مصفوفة فارغة
        parsedPhoneNumbers = [];
      }
    }

    // إعداد بيانات Explore
    const exploreData = {
      name_ar,
      name_en,
      cityId,
      description_ar,
      description_en,
      images: uploadedImages, // استخدام الصور المرفوعة
      socialLinks: parsedSocialLinks,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      phoneNumbers: parsedPhoneNumbers,
      openingHours: openingHours || '09:00-17:00',
      workingDays: workingDays || 'All Week'
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newExplore = await Explore.create(exploreData);

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: newExplore.id,
      name_ar: newExplore.name_ar,
      name_en: newExplore.name_en,
      cityId: newExplore.cityId,
      description_ar: newExplore.description_ar,
      description_en: newExplore.description_en,
      images: newExplore.images,
      socialLinks: newExplore.socialLinks,
      latitude: newExplore.latitude,
      longitude: newExplore.longitude,
      phoneNumbers: newExplore.phoneNumbers,
      openingHoursName: newExplore.openingHoursName,
      workingDaysName: newExplore.workingDaysName,
      createdAt: newExplore.createdAt,
      updatedAt: newExplore.updatedAt
    };

    console.log(`تم إنشاء سجل Explore بنجاح: ${newExplore.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Explore record created successfully.",
      data: result
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
    if (uploadedImages.length > 0) {
      try {
        await safeDeleteExploreFiles(uploadedImages);
        console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض جميع سجلات Explore
// ---------------------------------------------------------
exports.getAllExplores = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 سجلات في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // الحصول على السجلات مع التصفح
    const { count, rows: explores } = await Explore.findAndCountAll({
      include: [{
        model: City,
        attributes: ['id', 'name_ar', 'name_en']
      }],
      order: [['id', 'ASC']],
      limit,
      offset
    });

    // إنشاء كائن نظيف للنتائج بدون التكرار
    const result = explores.map(explore => ({
      id: explore.id,
      name_ar: explore.name_ar,
      name_en: explore.name_en,
      cityId: explore.cityId,
      description_ar: explore.description_ar,
      description_en: explore.description_en,
      images: explore.images,
      socialLinks: explore.socialLinks,
      latitude: explore.latitude,
      longitude: explore.longitude,
      phoneNumbers: explore.phoneNumbers, 
      openingHoursName: explore.openingHoursName,
      workingDaysName: explore.workingDaysName,
      createdAt: explore.createdAt,
      updatedAt: explore.updatedAt,
      City: explore.City
    }));

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All Explore records retrieved successfully.",
      count: result.length,
      data: result,
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
// 🔹 عرض سجل Explore محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getExploreById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const explore = await Explore.findByPk(id, {
      include: [{
        model: City,
        attributes: ['id', 'name_ar', 'name_en']
      }]
    });

    if (!explore) {
      const error = new Error('Explore record not found.');
      error.status = 404;
      throw error;
    }

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: explore.id,
      name_ar: explore.name_ar,
      name_en: explore.name_en,
      cityId: explore.cityId,
      description_ar: explore.description_ar,
      description_en: explore.description_en,
      images: explore.images,
      socialLinks: explore.socialLinks,
      latitude: explore.latitude,
      longitude: explore.longitude,
      phoneNumbers: explore.phoneNumbers, 
      openingHoursName: explore.openingHoursName,
      workingDaysName: explore.workingDaysName,
      createdAt: explore.createdAt,
      updatedAt: explore.updatedAt,
      City: explore.City
    };

    res.status(200).json({
      status: "success",
      message: "✅ Explore record found.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث سجل Explore (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateExplore = async (req, res, next) => {
  let newImages = [];

  try {
    const { id } = req.params;
    const {
      name_ar,
      name_en,
      cityId,
      description_ar,
      description_en,
      socialLinks,
      latitude,
      longitude,
      phoneNumbers,
      openingHours,
      workingDays
    } = req.body;

    console.log("=== تحديث سجل Explore ===");
    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    const explore = await Explore.findByPk(id);
    if (!explore) {
      if (req.dbFiles && req.dbFiles.images) {
        await safeDeleteExploreFiles(
          Array.isArray(req.dbFiles.images)
            ? req.dbFiles.images
            : [req.dbFiles.images]
        );
      }
      const error = new Error("Explore record not found.");
      error.status = 404;
      throw error;
    }

    // 🔹 تحديد الصور الجديدة المرفوعة إن وجدت
    if (req.dbFiles && req.dbFiles.images) {
      if (Array.isArray(req.dbFiles.images)) {
        newImages = [...req.dbFiles.images];
      } else if (typeof req.dbFiles.images === "string") {
        newImages = [req.dbFiles.images];
      }
    }

    // 🔹 التحقق من المدينة
    if (cityId) {
      const city = await City.findByPk(cityId);
      if (!city) {
        const error = new Error("City not found.");
        error.status = 404;
        throw error;
      }
    }

    // 🔹 معالجة روابط التواصل الاجتماعي
    let parsedSocialLinks = explore.socialLinks || [];
    if (socialLinks) {
      try {
        if (Array.isArray(socialLinks)) parsedSocialLinks = socialLinks;
        else if (typeof socialLinks === "string") {
          if (socialLinks.startsWith("[") && socialLinks.endsWith("]"))
            parsedSocialLinks = JSON.parse(socialLinks);
          else if (socialLinks.startsWith("{") && socialLinks.endsWith("}"))
            parsedSocialLinks = [JSON.parse(socialLinks)];
          else if (socialLinks.includes(","))
            parsedSocialLinks = socialLinks.split(",").map((l) => l.trim());
          else parsedSocialLinks = [socialLinks];
        } else if (typeof socialLinks === "object")
          parsedSocialLinks = [socialLinks];
      } catch (e) {
        console.log("خطأ في تحليل socialLinks:", e);
      }
    }

    // 🔹 معالجة أرقام الهواتف
    let parsedPhoneNumbers = explore.phoneNumbers || [];
    if (phoneNumbers) {
      try {
        if (Array.isArray(phoneNumbers)) parsedPhoneNumbers = phoneNumbers;
        else if (typeof phoneNumbers === "string") {
          if (phoneNumbers.startsWith("[") && phoneNumbers.endsWith("]"))
            parsedPhoneNumbers = JSON.parse(phoneNumbers);
          else if (phoneNumbers.startsWith("{") && phoneNumbers.endsWith("}"))
            parsedPhoneNumbers = [JSON.parse(phoneNumbers)];
          else if (phoneNumbers.includes(","))
            parsedPhoneNumbers = phoneNumbers
              .split(",")
              .map((n) => n.trim());
          else parsedPhoneNumbers = [phoneNumbers];
        } else if (typeof phoneNumbers === "object")
          parsedPhoneNumbers = [phoneNumbers];
      } catch (e) {
        console.log("خطأ في تحليل phoneNumbers:", e);
      }
    }

    // 🔹 تحضير بيانات التحديث
    const updateData = {
      name_ar: name_ar || explore.name_ar,
      name_en: name_en || explore.name_en,
      cityId: cityId || explore.cityId,
      description_ar: description_ar || explore.description_ar,
      description_en: description_en || explore.description_en,
      socialLinks: parsedSocialLinks,
      latitude: latitude ? parseFloat(latitude) : explore.latitude,
      longitude: longitude ? parseFloat(longitude) : explore.longitude,
      phoneNumbers: parsedPhoneNumbers,
      openingHours: openingHours || explore.openingHours,
      workingDays: workingDays || explore.workingDays
    };

    // ===========================================================
    // ✅ حذف الصور القديمة إذا تم رفع صور جديدة
    // ===========================================================
    if (newImages.length > 0) {
      console.log("📸 الصور الجديدة:", newImages);
      console.log("📸 الصور القديمة (خام):", explore.images);

      // تجهيز مصفوفة الصور القديمة للحذف
      let oldImages = [];
      if (Array.isArray(explore.images)) {
        oldImages = [...explore.images];
      } else if (typeof explore.images === "string") {
        try {
          oldImages = JSON.parse(explore.images);
        } catch (parseError) {
          console.warn("⚠️ تعذر تحليل الصور القديمة:", parseError);
          oldImages = [];
        }
      }

      // حذف الصور القديمة إن وجدت
      if (oldImages.length > 0) {
        try {
          console.log("🗑️ محاولة حذف الصور القديمة:", oldImages);
          const deleteResult = await safeDeleteExploreFiles(oldImages);
          console.log("نتيجة حذف الصور القديمة:", deleteResult);
        } catch (deleteError) {
          console.error("❌ خطأ في حذف الصور القديمة:", deleteError);
        }
      }

      // تعيين الصور الجديدة
      updateData.images = newImages;
      console.log("✅ تم تعيين الصور الجديدة:", newImages);
    } else {
      updateData.images = explore.images || [];
      console.log("📦 الاحتفاظ بالصور القديمة:", explore.images);
    }

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedExplore = await explore.update(updateData);

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: updatedExplore.id,
      name_ar: updatedExplore.name_ar,
      name_en: updatedExplore.name_en,
      cityId: updatedExplore.cityId,
      description_ar: updatedExplore.description_ar,
      description_en: updatedExplore.description_en,
      images: updatedExplore.images,
      socialLinks: updatedExplore.socialLinks,
      latitude: updatedExplore.latitude,
      longitude: updatedExplore.longitude,
      phoneNumbers: updatedExplore.phoneNumbers, 
      openingHoursName: updatedExplore.openingHoursName,
      workingDaysName: updatedExplore.workingDaysName,
      createdAt: updatedExplore.createdAt,
      updatedAt: updatedExplore.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Explore record updated successfully.",
      data: result,
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

    // حذف الصور الجديدة المرفوعة في حال حدوث خطأ
    if (newImages.length > 0) {
      try {
        await safeDeleteExploreFiles(newImages);
        console.log("🗑️ تم حذف الصور الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور الجديدة:", deleteError);
      }
    }

    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف سجل Explore (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteExplore = async (req, res, next) => {
  try {
    const { id } = req.params;

    // البحث عن السجل المطلوب حذفه
    const explore = await Explore.findByPk(id);
    if (!explore) {
      return res.status(404).json({
        status: "failure",
        message: "Explore record not found.",
      });
    }

    // 🔹 التحقق من وجود صور مرتبطة بالسجل
    let exploreImages = [];
    if (Array.isArray(explore.images)) {
      exploreImages = [...explore.images];
    } else if (typeof explore.images === "string") {
      try {
        exploreImages = JSON.parse(explore.images);
      } catch (parseError) {
        exploreImages = [];
      }
    }

    // 🔹 حذف الصور القديمة إن وجدت
    if (exploreImages && Array.isArray(exploreImages) && exploreImages.length > 0) {
      try {
        console.log("🗑️ حذف صور Explore:", exploreImages);
        await safeDeleteExploreFiles(exploreImages);
      } catch (err) {
        console.error("❌ خطأ في حذف صور Explore:", err);
      }
    }

    // 🔹 حذف السجل نفسه من قاعدة البيانات
    await explore.destroy();

    // 🔹 إرسال الرد النهائي
    res.status(200).json({
      status: "success",
      message: "🗑️ Explore record deleted successfully."
    });

  } catch (error) {
    console.error("Error in deleteExplore:", error);
    next(error);
  }
};