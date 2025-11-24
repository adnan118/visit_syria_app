/*
ملف وحدة تحكم التجارب (experiencesController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالتجارب
- يتعامل مع إنشاء، قراءة، تحديث، وحذف التجارب
- يربط بين طلبات المستخدم ونموذج التجربة

الوظائف:
- createExperience     → إنشاء تجربة جديدة
- getAllExperiences    → عرض جميع التجارب
- getExperienceById    → عرض تجربة محددة
- updateExperience     → تحديث تجربة
- deleteExperience     → حذف تجربة
*/

// استيراد نموذج التجربة
const Experience = require('../../models/experienceModel');

// استيراد نموذج المرشد السياحي
const TourGuide = require('../../models/tourGuideModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات التجارب
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteExperienceFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "experiences"
    return await deleteMultipleFiles(fileIdentifiers, "experiences");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء تجربة جديدة (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createExperience = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء تجربة جديدة ===");
    
    const { tourGuideId, description } = req.body;

    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    // التحقق من وجود صور مرفوعة وحفظها مؤقتًا
    if (req.dbFiles) {
      console.log("معالجة ملفات الصور المرفوعة:", req.dbFiles);
      
      // Handle single image upload (from 'image' field)
      if (req.dbFiles.image && Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
        uploadedImages = [...req.dbFiles.image]; // Create a copy
        console.log("الصور (مفردة):", uploadedImages);
      }
      // Handle multiple images upload (from 'images' field)
      else if (req.dbFiles.images && Array.isArray(req.dbFiles.images) && req.dbFiles.images.length > 0) {
        uploadedImages = [...req.dbFiles.images]; // Create a copy
        console.log("الصور (متعددة):", uploadedImages);
      }
    }

    // التحقق من الحقول المطلوبة
    if (!tourGuideId || !description) {
      const error = new Error('Please provide tour guide ID and description.');
      error.status = 400;
      throw error;
    }

    // التحقق من وجود المرشد السياحي
    const tourGuide = await TourGuide.findByPk(tourGuideId);
    if (!tourGuide) {
      const error = new Error('Tour guide not found.');
      error.status = 404;
      throw error;
    }

    // إعداد بيانات التجربة
    const experienceData = {
      tourGuideId,
      description,
      images: uploadedImages // استخدام الصور المرفوعة
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newExperience = await Experience.create(experienceData);

    // إضافة معلومات المرشد إلى الاستجابة
    newExperience.dataValues.tourGuide = {
      id: tourGuide.id,
      name: tourGuide.name,
      image: tourGuide.image
    };

    console.log(`تم إنشاء التجربة بنجاح: ${newExperience.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Experience created successfully.",
      data: newExperience
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
    if (uploadedImages && uploadedImages.length > 0) {
      try {
        // حذف الملفات المرفوعة
        const filesToDelete = [];
        if (Array.isArray(uploadedImages)) {
          filesToDelete.push(...uploadedImages);
        } else if (typeof uploadedImages === 'string') {
          filesToDelete.push(uploadedImages);
        }
        
        if (filesToDelete.length > 0) {
          await safeDeleteExperienceFiles(filesToDelete);
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
// 🔹 عرض جميع التجارب
// ---------------------------------------------------------
exports.getAllExperiences = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 6 تجارب في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // الحصول على التجارب مع التصفح
    const { count, rows: experiences } = await Experience.findAndCountAll({
      include: [{
        model: TourGuide,
        as: 'tourGuide',
        attributes: ['id', 'name', 'image']
      }],
      order: [['id', 'ASC']],
      limit,
      offset
    });

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All experiences retrieved successfully.",
      count: experiences.length,
      data: experiences,
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
// 🔹 عرض تجربة محددة بالرقم المعرف
// ---------------------------------------------------------
exports.getExperienceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findByPk(id, {
      include: [{
        model: TourGuide,
        as: 'tourGuide',
        attributes: ['id', 'name', 'image']
      }]
    });

    if (!experience) {
      const error = new Error('Experience not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Experience found.",
      data: experience
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث تجربة (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateExperience = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let newImages = [];
  
  try {
    const { id } = req.params;
    const { tourGuideId, description } = req.body;

    const experience = await Experience.findByPk(id);
    if (!experience) {
      // حذف الملفات الجديدة إذا تم رفعها
      if (req.dbFiles) {
        const filesToDelete = [];
        if (Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
          filesToDelete.push(...req.dbFiles.image);
        }
        if (Array.isArray(req.dbFiles.images) && req.dbFiles.images.length > 0) {
          filesToDelete.push(...req.dbFiles.images);
        }
        if (filesToDelete.length > 0) {
          await safeDeleteExperienceFiles(filesToDelete);
        }
      }
      const error = new Error('Experience not found.');
      error.status = 404;
      throw error;
    }

    // التحقق من وجود صور مرفوعة وحفظها مؤقتًا
    if (req.dbFiles) {
      // Handle single image upload (from 'image' field)
      if (req.dbFiles.image && Array.isArray(req.dbFiles.image) && req.dbFiles.image.length > 0) {
        newImages = [...req.dbFiles.image]; // Create a copy
      }
      // Handle multiple images upload (from 'images' field)
      else if (req.dbFiles.images && Array.isArray(req.dbFiles.images) && req.dbFiles.images.length > 0) {
        newImages = [...req.dbFiles.images]; // Create a copy
      }
    }

    // التحقق من وجود المرشد السياحي إذا تم توفيره
    if (tourGuideId) {
      const tourGuide = await TourGuide.findByPk(tourGuideId);
      if (!tourGuide) {
        const error = new Error('Tour guide not found.');
        error.status = 404;
        throw error;
      }
    }

    // إعداد بيانات التحديث
    const updateData = {
      tourGuideId,
      description
    };

    // إذا تم رفع صور جديدة
    if (req.dbFiles) {
      // إذا تم رفع صور جديدة، حذف الصور القديمة وتعيين الصور الجديدة
      if (newImages.length > 0) {
        // حذف الصور القديمة
        // التحقق مما إذا كانت الصور القديمة مصفوفة أم سلسلة نصية
        let oldImages = [];
        if (Array.isArray(experience.images)) {
          oldImages = [...experience.images];
        } else if (typeof experience.images === 'string') {
          try {
            oldImages = JSON.parse(experience.images);
          } catch (parseError) {
            oldImages = [];
          }
        }
        
        if (oldImages && Array.isArray(oldImages) && oldImages.length > 0) {
          // Delete old images using the experience-specific delete function
          const deletionResult = await safeDeleteExperienceFiles(oldImages);
        }
        // تعيين الصور الجديدة
        updateData.images = newImages;
      }
    }

    // تحديث البيانات
    const updatedExperience = await experience.update(updateData);

    // الحصول على معلومات المرشد المحدثة
    if (tourGuideId) {
      const updatedTourGuide = await TourGuide.findByPk(tourGuideId);
      updatedExperience.dataValues.tourGuide = {
        id: updatedTourGuide.id,
        name: updatedTourGuide.name,
        image: updatedTourGuide.image
      };
    }

    res.status(200).json({
      status: "success",
      message: "✅ Experience updated successfully.",
      data: updatedExperience
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
    if (newImages.length > 0) {
      try {
        await safeDeleteExperienceFiles(newImages);
        console.log('تم حذف الملفات المرفوعة الجديدة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة الجديدة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف تجربة (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteExperience = async (req, res, next) => {
  try {
    const { id } = req.params;

    const experience = await Experience.findByPk(id);
    if (!experience) {
      return res.status(404).json({
        status: "failure",
        message: "Experience not found.",
      });
    }

    // حذف صور التجربة إذا كانت موجودة
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
    
    if (experienceImages && Array.isArray(experienceImages) && experienceImages.length > 0) {
      try {
        // حذف صور التجربة من النظام باستخدام دالة مخصصة
        await safeDeleteExperienceFiles(experienceImages);
      } catch (err) {
        // طباعة رسالة خطأ في الكونسول
        console.error("❌ خطأ في حذف صور التجربة:", err);
      }
    }

    await experience.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Experience deleted successfully."
    });
  } catch (error) {
    console.error('Error in deleteExperience:', error);
    next(error);
  }
};