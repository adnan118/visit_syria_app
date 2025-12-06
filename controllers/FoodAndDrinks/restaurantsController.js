/*
ملف وحدة تحكم المطاعم (restaurantsController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالمطاعم
- يتعامل مع إنشاء، قراءة، تحديث، وحذف المطاعم
- يربط بين طلبات المستخدم ونموذج المطعم

الوظائف:
- createRestaurant     → إنشاء مطعم جديد
- getAllRestaurants    → عرض جميع المطاعم
- getRestaurantById    → عرض مطعم محدد
- updateRestaurant     → تحديث مطعم
- deleteRestaurant     → حذف مطعم
*/

// استيراد نموذج المطعم
const Restaurant = require('../../models/restaurantModel');

// استيراد نموذج المدينة
const City = require('../../models/cityModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات المطاعم
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteRestaurantFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "restaurants"
    return await deleteMultipleFiles(fileIdentifiers, "restaurants");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء مطعم جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createRestaurant = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء مطعم جديد ===");
    
    const { 
      cityId, 
      name_ar,
      name_en, 
      description_ar, 
      description_en, 
      cuisineType, 
      rating, 
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
    if (!cityId || !name_ar || !name_en) {
      const error = new Error('Please provide city ID, Arabic restaurant name, and English restaurant name.');
      error.status = 400;
      throw error;
    }

    // التحقق من نوع المطبخ
    const validCuisineTypes = ['Syrian', 'Seafood', 'Desserts', 'International', 'Fast Food', 'Traditional'];
    if (cuisineType && !validCuisineTypes.includes(cuisineType)) {
      const error = new Error(`Invalid cuisine type. Valid types are: ${validCuisineTypes.join(', ')}`);
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

    // التحقق من صحة التقييم إذا تم توفيره
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      const error = new Error('Rating must be between 0 and 5.');
      error.status = 400;
      throw error;
    }

    // إعداد بيانات المطعم
    const restaurantData = {
      cityId,
      name_ar,
      name_en,
      description_ar,
      description_en,
      cuisineType,
      rating,
      openingHours,
      workingDays,
      images: uploadedImages, // استخدام الصور المرفوعة
      phoneNumbers: Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : (typeof phoneNumbers === 'string' && !phoneNumbers.startsWith('[') ? phoneNumbers : (typeof phoneNumbers === 'string' ? JSON.parse(phoneNumbers).join(',') : phoneNumbers)),
      socialLinks: typeof socialLinks === 'string' && !socialLinks.startsWith('[') && !socialLinks.startsWith('{') ? socialLinks.split(',') : (typeof socialLinks === 'string' && socialLinks.startsWith('{') ? JSON.parse(socialLinks) : socialLinks),
      latitude,
      longitude
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newRestaurant = await Restaurant.create(restaurantData);

    // إضافة معلومات المدينة إلى الاستجابة
    newRestaurant.dataValues.city = {
      id: city.id,
      name_ar: city.name_ar,
      name_en: city.name_en
    };

    // إضافة ترجمة نوع المطبخ إلى الاستجابة
    if (newRestaurant.cuisineTypeName) {
      newRestaurant.dataValues.cuisineType = newRestaurant.cuisineTypeName;
    }

    console.log(`تم إنشاء المطعم بنجاح: ${newRestaurant.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Restaurant created successfully.",
      data: newRestaurant
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
          await safeDeleteRestaurantFiles(filesToDelete);
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
// 🔹 عرض جميع المطاعم
// ---------------------------------------------------------
exports.getAllRestaurants = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6; // 6 مطاعم في كل صفحة كطلب
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
    
    // التحقق من ترتيب التقييم (rating) - فقط إذا لم يكن هناك تصفية
    if (!req.query.rating || isNaN(parseFloat(req.query.rating))) {
      if (req.query.sort === 'rating_asc') {
        order.push(['rating', 'ASC']);
      } else if (req.query.sort === 'rating_desc') {
        order.push(['rating', 'DESC']);
      } else {
        // افتراضياً نرتب حسب التقييم من الأعلى إلى الأدنى
        order.push(['rating', 'DESC']);
      }
    }
    
    queryOptions.order = order;

    // التحقق من تصفية المدينة
    if (req.query.cityId) {
      queryOptions.where = queryOptions.where || {};
      queryOptions.where.cityId = req.query.cityId;
    }
    
    // التحقق من تصفية التقييم
    if (req.query.rating && !isNaN(parseFloat(req.query.rating))) {
      // إذا كان rating يحتوي على قيمة رقمية، نستخدمها كتصفية
      const ratingValue = parseFloat(req.query.rating);
      if (ratingValue >= 0 && ratingValue <= 5) {
        queryOptions.where = queryOptions.where || {};
        queryOptions.where.rating = ratingValue;
      }
    }

    // الحصول على المطاعم مع التصفح
    const { count, rows: restaurants } = await Restaurant.findAndCountAll(queryOptions);

    // إضافة ترجمة نوع المطبخ إلى كل مطعم في الاستجابة
    restaurants.forEach(restaurant => {
      if (restaurant.cuisineTypeName) {
        restaurant.dataValues.cuisineType = restaurant.cuisineTypeName;
      }
    });

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All restaurants retrieved successfully.",
      count: restaurants.length,
      data: restaurants,
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
// 🔹 عرض مطعم محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findByPk(id, {
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name_ar', 'name_en']
      }]
    });

    if (!restaurant) {
      const error = new Error('Restaurant not found.');
      error.status = 404;
      throw error;
    }

    // إضافة ترجمة نوع المطبخ إلى الاستجابة
    if (restaurant.cuisineTypeName) {
      restaurant.dataValues.cuisineType = restaurant.cuisineTypeName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Restaurant found.",
      data: restaurant
    });
  } catch (error) {
    next(error);
  }
};

 
// ---------------------------------------------------------
// 🔹 تحديث مطعم (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateRestaurant = async (req, res, next) => {
  let newImages = [];

  try {
    const { id } = req.params;
    const {
      cityId,
      name_ar,
      name_en,
      description_ar,
      description_en,
      cuisineType,
      rating,
      openingHours,
      workingDays,
      phoneNumbers,
      socialLinks,
      latitude,
      longitude,
      keepImages
    } = req.body;

    console.log("=== تحديث مطعم ===");
    console.log("📦 البيانات المستلمة:", req.body);
    console.log("📸 الملفات المرفوعة:", req.dbFiles);

    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      if (req.dbFiles && (req.dbFiles.image || req.dbFiles.images)) {
        const filesToDelete = [
          ...(req.dbFiles.image || []),
          ...(req.dbFiles.images || []),
        ];
        if (filesToDelete.length > 0) await safeDeleteRestaurantFiles(filesToDelete);
      }
      const error = new Error("Restaurant not found.");
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

    // 🔹 التحقق من نوع المطبخ
    const validCuisineTypes = ['Syrian', 'Seafood', 'Desserts', 'International', 'Fast Food', 'Traditional'];
    if (cuisineType && !validCuisineTypes.includes(cuisineType)) {
      const error = new Error(`Invalid cuisine type. Valid types are: ${validCuisineTypes.join(', ')}`);
      error.status = 400;
      throw error;
    }

    // 🔹 تحقق من التقييم
    if (rating !== undefined && (rating < 0 || rating > 5)) {
      const error = new Error("Rating must be between 0 and 5.");
      error.status = 400;
      throw error;
    }

    // 🔹 تحضير بيانات التحديث
    const updateData = {
      cityId: cityId || restaurant.cityId,
      name_ar: name_ar || restaurant.name_ar,
      name_en: name_en || restaurant.name_en,
      description_ar: description_ar || restaurant.description_ar,
      description_en: description_en || restaurant.description_en,
      cuisineType: cuisineType || restaurant.cuisineType,
      rating: rating ?? restaurant.rating,
      openingHours: openingHours || restaurant.openingHours,
      workingDays: workingDays || restaurant.workingDays,
      phoneNumbers: phoneNumbers ? (Array.isArray(phoneNumbers) ? phoneNumbers.join(',') : (typeof phoneNumbers === 'string' && !phoneNumbers.startsWith('[') ? phoneNumbers : (typeof phoneNumbers === 'string' ? JSON.parse(phoneNumbers).join(',') : phoneNumbers))) : restaurant.phoneNumbers,
      socialLinks: socialLinks ? (typeof socialLinks === 'string' && !socialLinks.startsWith('[') && !socialLinks.startsWith('{') ? socialLinks.split(',') : (typeof socialLinks === 'string' && socialLinks.startsWith('{') ? JSON.parse(socialLinks) : socialLinks)) : restaurant.socialLinks,
      latitude: latitude ? parseFloat(latitude) : restaurant.latitude,
      longitude: longitude ? parseFloat(longitude) : restaurant.longitude,
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
        finalImages = restaurant.images || [];
      }
    }

    // إذا تم رفع صور جديدة، حذف الصور القديمة غير المحتفظ بها
    if (newImages.length > 0) {
      // تحديد الصور القديمة التي يجب حذفها
      const currentImages = restaurant.images || [];
      // إذا لم يتم إرسال قائمة keepImages، نحذف جميع الصور القديمة
      const imagesToDelete = keepImages && Array.isArray(keepImages) 
        ? currentImages.filter(imageUrl => !keepImages.includes(imageUrl))
        : [...currentImages];
      
      if (imagesToDelete.length > 0) {
        try {
          // حذف الصور غير المحتفظ بها
          await safeDeleteRestaurantFiles(imagesToDelete);
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
    const updatedRestaurant = await restaurant.update(updateData);

    // إضافة ترجمة نوع المطبخ إلى الاستجابة
    if (updatedRestaurant.cuisineTypeName) {
      updatedRestaurant.dataValues.cuisineType = updatedRestaurant.cuisineTypeName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Restaurant updated successfully.",
      data: updatedRestaurant,
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
        await safeDeleteRestaurantFiles(newImages);
        console.log("🗑️ تم حذف الصور الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور الجديدة:", deleteError);
      }
    }

    next(error);
  }
};


// ---------------------------------------------------------
// 🔹 حذف مطعم (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteRestaurant = async (req, res, next) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({
        status: "failure",
        message: "Restaurant not found.",
      });
    }

    // 🔹 التحقق من وجود صور مرتبطة بالمطعم
    let restaurantImages = [];
    if (Array.isArray(restaurant.images)) {
      restaurantImages = [...restaurant.images];
    } else if (typeof restaurant.images === "string") {
      try {
        restaurantImages = JSON.parse(restaurant.images);
      } catch {
        restaurantImages = [];
      }
    }

    // 🔹 حذف الصور القديمة إن وجدت
    if (restaurantImages.length > 0) {
      try {
        console.log("🗑️ حذف صور المطعم:", restaurantImages);
        await safeDeleteRestaurantFiles(restaurantImages);
      } catch (err) {
        console.error("❌ خطأ في حذف صور المطعم:", err);
      }
    }

    await restaurant.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Restaurant deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteRestaurant:", error);
    next(error);
  }
};
