/*
ملف وحدة تحكم المرشدين السياحيين (tourGuidesController.js)
----------------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالمرشدين السياحيين
- يتعامل مع إنشاء، قراءة، تحديث، وحذف المرشدين السياحيين
- يربط بين طلبات المستخدم ونموذج المرشد السياحي

الوظائف:
- createTourGuide     → إنشاء مرشد سياحي جديد
- getAllTourGuides    → عرض جميع المرشدين السياحيين
- getTourGuideById    → عرض مرشد سياحي محدد
- updateTourGuide     → تحديث مرشد سياحي
- deleteTourGuide     → حذف مرشد سياحي
*/

// استيراد نموذج المرشد السياحي
const TourGuide = require('../../models/tourGuideModel');

// استيراد نموذج المدينة للتحقق من وجود المدينة
const City = require('../../models/cityModel');

// استيراد نموذج التجربة
const Experience = require('../../models/experienceModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف الملفات
const safeDeleteFiles = async (fileIdentifiers = []) => {
  try {
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0) return null;
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    return await deleteMultipleFiles(fileIdentifiers, 'tourGuides');
  } catch (e) {
    console.error("❌ خطأ في حذف الملفات:", e);
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء مرشد سياحي جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createTourGuide = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImage = null;
  
  try {
    console.log("=== إنشاء مرشد سياحي جديد ===");
    
    const { name, cityId, phone, socialMedia, bio } = req.body;

    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    // التحقق من وجود صورة مرفوعة وحفظها مؤقتًا
    if (
      req.dbFiles &&
      Array.isArray(req.dbFiles.image) &&
      req.dbFiles.image.length > 0
    ) {
      // حفظ الصورة الجديدة من الملفات المرفوعة
      uploadedImage = req.dbFiles.image[0];
    }

    // التحقق من الحقول المطلوبة
    if (!name || !cityId || !phone) {
      const error = new Error('Please provide name, city, and phone number.');
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

    // التحقق من صيغة رقم الهاتف
    const phoneRegex = /^[0-9+\-\s()]+$/;
    if (!phoneRegex.test(phone)) {
      const error = new Error('Please provide a valid phone number.');
      error.status = 400;
      throw error;
    }

    // إعداد بيانات المرشد السياحي
    const tourGuideData = {
      name,
      cityId,
      phone,
      socialMedia: socialMedia || {},
      bio,
      image: uploadedImage || "default-user.png" // استخدام الصورة المرفوعة أو الافتراضية
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newTourGuide = await TourGuide.create(tourGuideData);

    // إضافة معلومات المدينة إلى الاستجابة
    newTourGuide.dataValues.city = city;

    console.log(`تم إنشاء المرشد السياحي بنجاح: ${newTourGuide.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Tour guide created successfully.",
      data: newTourGuide
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
        await safeDeleteFiles([uploadedImage]);
        console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض جميع المرشدين السياحيين
// ---------------------------------------------------------
exports.getAllTourGuides = async (req, res, next) => {
  try {
    const tourGuides = await TourGuide.findAll({
      include: [{
        model: City,
        attributes: ['id', 'name_ar', 'name_en']
      }],
      order: [['id', 'ASC']]
    });

    res.status(200).json({
      status: "success",
      message: "✅ All tour guides retrieved successfully.",
      count: tourGuides.length,
      data: tourGuides
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض مرشد سياحي محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getTourGuideById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const tourGuide = await TourGuide.findByPk(id, {
      include: [{
        model: City,
        attributes: ['id', 'name_ar', 'name_en']
      }]
    });

    if (!tourGuide) {
      const error = new Error('Tour guide not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Tour guide found.",
      data: tourGuide
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث مرشد سياحي (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateTourGuide = async (req, res, next) => {
  try {
    console.log("=== تحديث مرشد سياحي ===");
    
    const { id } = req.params;
    const { name, cityId, phone, socialMedia, bio } = req.body;

    console.log(`معرف المرشد: ${id}`);
    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    const tourGuide = await TourGuide.findByPk(id);
    if (!tourGuide) {
      // حذف الملفات الجديدة إذا تم رفعها
      if (req.dbFiles?.image) {
        await safeDeleteFiles(req.dbFiles.image);
      }
      const error = new Error('Tour guide not found.');
      error.status = 404;
      throw error;
    }

    // التحقق من صيغة رقم الهاتف إذا تم توفيره
    if (phone) {
      const phoneRegex = /^[0-9+\-\s()]+$/;
      if (!phoneRegex.test(phone)) {
        const error = new Error('Please provide a valid phone number.');
        error.status = 400;
        throw error;
      }
    }

    // التحقق من وجود المدينة إذا تم توفيرها
    if (cityId) {
      const city = await City.findByPk(cityId);
      if (!city) {
        const error = new Error('City not found.');
        error.status = 404;
        throw error;
      }
    }

    // إعداد بيانات التحديث
    const updateData = {
      name,
      cityId,
      phone,
      socialMedia,
      bio
    };

    // إذا تم رفع صورة جديدة
    if (req.dbFiles?.image && req.dbFiles.image.length > 0) {
      // حذف الصورة القديمة إذا لم تكن الصورة الافتراضية
      if (tourGuide.image && tourGuide.image !== "default-user.png") {
        await safeDeleteFiles([tourGuide.image]);
      }
      updateData.image = req.dbFiles.image[0];
    }

    // تحديث البيانات
    await tourGuide.update(updateData);

    // الحصول على معلومات المدينة المحدثة
    if (cityId) {
      const updatedCity = await City.findByPk(cityId);
      tourGuide.dataValues.city = updatedCity;
    }

    console.log(`تم تحديث المرشد السياحي بنجاح: ${tourGuide.id}`);

    res.status(200).json({
      status: "success",
      message: "✅ Tour guide updated successfully.",
      data: tourGuide
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
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف مرشد سياحي (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteTourGuide = async (req, res, next) => {
  try {
    const { id } = req.params;

    // الحصول على المرشد مع تجاربه المرتبطة
    const tourGuide = await TourGuide.findByPk(id, {
      include: [{
        model: Experience,
        as: 'experiences'
      }]
    });
    
    if (!tourGuide) {
      return res.status(404).json({
        status: "failure",
        message: "Tour guide not found.",
      });
    }

    // حذف صورة المرشد إذا كانت موجودة وليست الصورة الافتراضية
    if (tourGuide.image && tourGuide.image !== "default-user.png") {
      try {
        // حذف صورة المرشد من النظام
        await safeDeleteFiles([tourGuide.image]);
      } catch (err) {
        // طباعة رسالة خطأ في الكونسول
        console.error("❌ خطأ في حذف صورة المرشد السياحي:", err);
      }
    }

    // حذف صور التجارب المرتبطة بالمرشد
    if (tourGuide.experiences && tourGuide.experiences.length > 0) {
      // جمع جميع صور التجارب
      const allExperienceImages = [];
      
      for (const experience of tourGuide.experiences) {
        // التحقق مما إذا كانت الصور مصفوفة أم سلسلة نصية
        let experienceImages = [];
        if (Array.isArray(experience.images)) {
          experienceImages = [...experience.images];
        } else if (typeof experience.images === 'string') {
          try {
            experienceImages = JSON.parse(experience.images);
          } catch (parseError) {
            experienceImages = [];
          }
        }
        
        // إضافة صور التجربة إلى القائمة
        if (experienceImages && Array.isArray(experienceImages) && experienceImages.length > 0) {
          allExperienceImages.push(...experienceImages);
        }
      }
      
      // حذف جميع صور التجارب
      if (allExperienceImages.length > 0) {
        try {
          await safeDeleteFiles(allExperienceImages);
        } catch (err) {
          console.error("❌ خطأ في حذف صور تجارب المرشد:", err);
        }
      }
    }

    // حذف المرشد (سيؤدي إلى حذف التجارب المرتبطة تلقائيًا بسبب الإعداد onDelete: 'CASCADE')
    await tourGuide.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Tour guide and related experiences deleted successfully."
    });
  } catch (error) {
    console.error('Error in deleteTourGuide:', error);
    next(error);
  }
};