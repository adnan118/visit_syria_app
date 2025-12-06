/*
ملف وحدة تحكم الكافتيريا (cafeteriaController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالكافتيريا
- يتعامل مع إنشاء، قراءة، تحديث، وحذف الكافتيريا
- يربط بين طلبات المستخدم ونموذج الكافتيريا

الوظائف:
- createCafeteria     → إنشاء كافتيريا جديد
- getAllCafeterias    → عرض جميع الكافتيريا
- getCafeteriaById    → عرض كافتيريا محدد
- updateCafeteria     → تحديث كافتيريا
- deleteCafeteria     → حذف كافتيريا
*/

// استيراد نموذج الكافتيريا
const Cafeteria = require('../../models/cafeteriaModel');

// استيراد نموذج المدينة
const City = require('../../models/cityModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات الكافتيريا
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteCafeteriaFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "cafeterias"
    return await deleteMultipleFiles(fileIdentifiers, "cafeterias");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء كافتيريا جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createCafeteria = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء كافتيريا جديد ===");
    
    const { 
      cityId, 
      name_ar,
      name_en,
      description_ar, 
      description_en, 
      cafeteriaType, 
      openingHours, 
      workingDays, 
      phoneNumbers, 
      socialLinks, 
      latitude, 
      longitude 
    } = req.body;

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
    if (!cityId || !name_ar || !name_en || !description_ar || !description_en) {
      const error = new Error('Please provide city ID, Arabic name, English name, Arabic description, and English description.');
      error.status = 400;
      throw error;
    }

    // التحقق من نوع الكافتيريا
    const validCafeteriaTypes = ['Popular', 'Luxury', 'Terraces', 'Cafe', 'Entertainment Tent'];
    if (cafeteriaType && !validCafeteriaTypes.includes(cafeteriaType)) {
      const error = new Error(`Invalid cafeteria type. Valid types are: ${validCafeteriaTypes.join(', ')}`);
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

    // إعداد بيانات الكافتيريا
    const cafeteriaData = {
      cityId,
      name_ar,
      name_en,
      description_ar,
      description_en,
      cafeteriaType,
      openingHours,
      workingDays,
      images: uploadedImages, // استخدام الصور المرفوعة
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : (typeof phoneNumbers === 'string' && !phoneNumbers.startsWith('[') ? phoneNumbers : (typeof phoneNumbers === 'string' ? JSON.parse(phoneNumbers).join(',') : phoneNumbers)),
      socialLinks: typeof socialLinks === 'string' && !socialLinks.startsWith('[') && !socialLinks.startsWith('{') ? socialLinks.split(',') : (typeof socialLinks === 'string' && socialLinks.startsWith('{') ? JSON.parse(socialLinks) : socialLinks),
      latitude,
      longitude
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newCafeteria = await Cafeteria.create(cafeteriaData);

    // إضافة معلومات المدينة إلى الاستجابة
    newCafeteria.dataValues.city = {
      id: city.id,
      name_ar: city.name_ar,
      name_en: city.name_en
    };

    // إضافة ترجمة نوع الكافتيريا إلى الاستجابة
    if (newCafeteria.cafeteriaTypeName) {
      newCafeteria.dataValues.cafeteriaType = newCafeteria.cafeteriaTypeName;
    }
    if (newCafeteria.openingHoursName) {
      newCafeteria.dataValues.openingHours = newCafeteria.openingHoursName;
    }
    if (newCafeteria.workingDaysName) {
      newCafeteria.dataValues.workingDays = newCafeteria.workingDaysName;
    }

    console.log(`تم إنشاء الكافتيريا بنجاح: ${newCafeteria.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Cafeteria created successfully.",
      data: newCafeteria
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
          await safeDeleteCafeteriaFiles(filesToDelete);
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
// 🔹 عرض جميع الكافتيريا
// ---------------------------------------------------------
exports.getAllCafeterias = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 6 كافتيريا في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // إعداد خيارات الاستعلام
    const queryOptions = {
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name_ar', 'name_en']
      }],
      limit,
      offset
    };

    // إعداد ترتيب النتائج
    const order = [];
    
    // التحقق من ترتيب المدينة (city)
    if (req.query.city === 'asc') {
      order.push([City, 'name_en', 'ASC']);
    } else if (req.query.city === 'desc') {
      order.push([City, 'name_en', 'DESC']);
    }
    
    // التحقق من ترتيب الاسم (name)
    if (req.query.name === 'asc') {
      order.push(['name_en', 'ASC']);
    } else if (req.query.name === 'desc') {
      order.push(['name_en', 'DESC']);
    }
    
    // إذا لم يتم تحديد ترتيب، نستخدم الترتيب الافتراضي
    if (order.length === 0) {
      order.push(['id', 'ASC']);
    }
    
    queryOptions.order = order;

    // التحقق من تصفية المدينة
    if (req.query.cityId) {
      queryOptions.where = {
        cityId: req.query.cityId
      };
    }

    // الحصول على الكافتيريا مع التصفح
    const { count, rows: cafeterias } = await Cafeteria.findAndCountAll(queryOptions);

    // إضافة ترجمة نوع الكافتيريا إلى كل كافتيريا في الاستجابة
    cafeterias.forEach(cafeteria => {
      if (cafeteria.cafeteriaTypeName) {
        cafeteria.dataValues.cafeteriaType = cafeteria.cafeteriaTypeName;
      }
      if (cafeteria.openingHoursName) {
        cafeteria.dataValues.openingHours = cafeteria.openingHoursName;
      }
      if (cafeteria.workingDaysName) {
        cafeteria.dataValues.workingDays = cafeteria.workingDaysName;
      }
    });

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All cafeterias retrieved successfully.",
      count: cafeterias.length,
      data: cafeterias,
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
// 🔹 عرض كافتيريا محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getCafeteriaById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cafeteria = await Cafeteria.findByPk(id, {
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name_ar', 'name_en']
      }]
    });

    if (!cafeteria) {
      const error = new Error('Cafeteria not found.');
      error.status = 404;
      throw error;
    }

    // إضافة ترجمة نوع الكافتيريا إلى الاستجابة
    if (cafeteria.cafeteriaTypeName) {
      cafeteria.dataValues.cafeteriaType = cafeteria.cafeteriaTypeName;
    }
    if (cafeteria.openingHoursName) {
      cafeteria.dataValues.openingHours = cafeteria.openingHoursName;
    }
    if (cafeteria.workingDaysName) {
      cafeteria.dataValues.workingDays = cafeteria.workingDaysName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Cafeteria found.",
      data: cafeteria
    });
  } catch (error) {
    next(error);
  }
};

 
// ---------------------------------------------------------
// 🔹 تحديث كافتيريا (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateCafeteria = async (req, res, next) => {
  let newImages = [];

  try {
    const { id } = req.params;
    const {
      cityId,
      name_ar,
      name_en,
      description_ar,
      description_en,
      cafeteriaType,
      openingHours,
      workingDays,
      phoneNumbers,
      socialLinks,
      latitude,
      longitude,
      keepImages
    } = req.body;

    console.log("=== تحديث كافتيريا ===");
    console.log("📦 البيانات المستلمة:", req.body);
    console.log("📸 الملفات المرفوعة:", req.dbFiles);

    const cafeteria = await Cafeteria.findByPk(id);
    if (!cafeteria) {
      if (req.dbFiles && (req.dbFiles.image || req.dbFiles.images)) {
        const filesToDelete = [
          ...(req.dbFiles.image || []),
          ...(req.dbFiles.images || []),
        ];
        if (filesToDelete.length > 0) await safeDeleteCafeteriaFiles(filesToDelete);
      }
      const error = new Error("Cafeteria not found.");
      error.status = 404;
      throw error;
    }

    // 🔹 تحديد الصور الجديدة المرفوعة إن وجدت
    if (req.dbFiles) {
      if (Array.isArray(req.dbFiles.images)) newImages = [...req.dbFiles.images];
      else if (typeof req.dbFiles.images === "string") newImages = [req.dbFiles.images];
      else if (Array.isArray(req.dbFiles.image)) newImages = [...req.dbFiles.image];
      else if (typeof req.dbFiles.image === "string") newImages = [req.dbFiles.image];
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

    // 🔹 التحقق من نوع الكافتيريا
    const validCafeteriaTypes = ['Popular', 'Luxury', 'Terraces', 'Cafe', 'Entertainment Tent'];
    if (cafeteriaType && !validCafeteriaTypes.includes(cafeteriaType)) {
      const error = new Error(`Invalid cafeteria type. Valid types are: ${validCafeteriaTypes.join(', ')}`);
      error.status = 400;
      throw error;
    }

    // 🔹 التحقق من أوقات العمل
    const validOpeningHoursUpdate = ['24/7', '08:00-16:00', '09:00-17:00', '10:00-22:00', '12:00-24:00', '16:00-02:00'];
    if (openingHours && !validOpeningHoursUpdate.includes(openingHours)) {
      const error = new Error(`Invalid opening hours. Valid options are: ${validOpeningHoursUpdate.join(', ')}`);
      error.status = 400;
      throw error;
    }

    // 🔹 التحقق من أيام العمل
    const validWorkingDaysUpdate = ['All Week', 'Sunday to Thursday', 'Saturday to Wednesday', 'Monday to Friday', 'Custom Days'];
    if (workingDays && !validWorkingDaysUpdate.includes(workingDays)) {
      const error = new Error(`Invalid working days. Valid options are: ${validWorkingDaysUpdate.join(', ')}`);
      error.status = 400;
      throw error;
    }


    // 🔹 تحضير بيانات التحديث
    const updateData = {
      cityId: cityId || cafeteria.cityId,
      name_ar: name_ar || cafeteria.name_ar,
      name_en: name_en || cafeteria.name_en,
      description_ar: description_ar || cafeteria.description_ar,
      description_en: description_en || cafeteria.description_en,
      cafeteriaType: cafeteriaType || cafeteria.cafeteriaType,
      openingHours: openingHours || cafeteria.openingHours,
      workingDays: workingDays || cafeteria.workingDays,
      phoneNumbers: phoneNumbers ? (Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : (typeof phoneNumbers === 'string' && !phoneNumbers.startsWith('[') ? phoneNumbers : (typeof phoneNumbers === 'string' ? JSON.parse(phoneNumbers).join(',') : phoneNumbers))) : cafeteria.phoneNumbers,
      socialLinks: socialLinks ? (typeof socialLinks === 'string' && !socialLinks.startsWith('[') && !socialLinks.startsWith('{') ? socialLinks.split(',') : (typeof socialLinks === 'string' && socialLinks.startsWith('{') ? JSON.parse(socialLinks) : socialLinks)) : cafeteria.socialLinks,
      latitude: latitude ? parseFloat(latitude) : cafeteria.latitude,
      longitude: longitude ? parseFloat(longitude) : cafeteria.longitude,
    };

    // معالجة الصور:
    // 1. إذا تم رفع صور جديدة، نستخدم الصور الجديدة فقط (نحذف القديمة)
    // 2. إذا لم يتم رفع صور جديدة، نحتفظ بالصور الحالية
    let finalImages = [];

    // إذا تم رفع صور جديدة
    if (newImages.length > 0) {
      // إذا تم إرسال قائمة الصور المطلوب الاحتفاظ بها
      if (keepImages && Array.isArray(keepImages)) {
        // دمج الصور المحتفظ بها مع الصور الجديدة
        finalImages = [...keepImages, ...newImages];
      } else {
        // إذا لم يتم إرسال قائمة keepImages، نستخدم الصور الجديدة فقط
        finalImages = [...newImages];
      }
    } else {
      // إذا لم يتم رفع صور جديدة
      if (keepImages && Array.isArray(keepImages)) {
        // نحتفظ فقط بالصور المحددة
        finalImages = [...keepImages];
      } else {
        // نحتفظ بجميع الصور الحالية
        finalImages = cafeteria.images || [];
      }
    }

    // إذا تم رفع صور جديدة، حذف الصور القديمة غير المحتفظ بها
    if (newImages.length > 0) {
      // تحديد الصور القديمة التي يجب حذفها
      const currentImages = cafeteria.images || [];
      // إذا لم يتم إرسال قائمة keepImages، نحذف جميع الصور القديمة
      const imagesToDelete = keepImages && Array.isArray(keepImages) 
        ? currentImages.filter(imageUrl => !keepImages.includes(imageUrl))
        : [...currentImages];
      
      if (imagesToDelete.length > 0) {
        try {
          // حذف الصور غير المحتفظ بها
          await safeDeleteCafeteriaFiles(imagesToDelete);
        } catch (deleteError) {
          console.error('خطأ في حذف الصور القديمة:', deleteError);
        }
      }
    }

    // تعيين الصور النهائية
    updateData.images = finalImages;

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedCafeteria = await cafeteria.update(updateData);

    // إضافة ترجمة نوع الكافتيريا إلى الاستجابة
    if (updatedCafeteria.cafeteriaTypeName) {
      updatedCafeteria.dataValues.cafeteriaType = updatedCafeteria.cafeteriaTypeName;
    }
    if (updatedCafeteria.openingHoursName) {
      updatedCafeteria.dataValues.openingHours = updatedCafeteria.openingHoursName;
    }
    if (updatedCafeteria.workingDaysName) {
      updatedCafeteria.dataValues.workingDays = updatedCafeteria.workingDaysName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Cafeteria updated successfully.",
      data: updatedCafeteria,
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
        await safeDeleteCafeteriaFiles(newImages);
        console.log("🗑️ تم حذف الصور الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور الجديدة:", deleteError);
      }
    }

    next(error);
  }
};


// ---------------------------------------------------------
// 🔹 حذف كافتيريا (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteCafeteria = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cafeteria = await Cafeteria.findByPk(id);

    if (!cafeteria) {
      return res.status(404).json({
        status: "failure",
        message: "Cafeteria not found.",
      });
    }

    // 🔹 التحقق من وجود صور مرتبطة بالكافتيريا
    let cafeteriaImages = [];
    if (Array.isArray(cafeteria.images)) {
      cafeteriaImages = [...cafeteria.images];
    } else if (typeof cafeteria.images === "string") {
      try {
        cafeteriaImages = JSON.parse(cafeteria.images);
      } catch {
        cafeteriaImages = [];
      }
    }

    // 🔹 حذف الصور القديمة إن وجدت
    if (cafeteriaImages.length > 0) {
      try {
        console.log("🗑️ حذف صور الكافتيريا:", cafeteriaImages);
        await safeDeleteCafeteriaFiles(cafeteriaImages);
      } catch (err) {
        console.error("❌ خطأ في حذف صور الكافتيريا:", err);
      }
    }

    await cafeteria.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Cafeteria deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteCafeteria:", error);
    next(error);
  }
};