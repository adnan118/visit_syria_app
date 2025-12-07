/*
ملف وحدة تحكم العروض (offersController.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بالعروض
- يتعامل مع إنشاء، قراءة، تحديث، وحذف العروض
- يربط بين طلبات المستخدم ونموذج العرض

الوظائف:
- createOffer     → إنشاء عرض جديد
- getAllOffers    → عرض جميع العروض
- getOfferById    → عرض عرض محدد
- updateOffer     → تحديث عرض
- deleteOffer     → حذف عرض
*/

// استيراد نموذج العرض
const { Offer, City } = require('../../models');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات العروض
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteOfferFiles = async (fileIdentifiers = []) => {
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
    
    // حذف الملفات بإدخال نوع المحتوى "offers"
    return await deleteMultipleFiles(fileIdentifiers, "offers");
  } catch (e) {
    // العودة بnull في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 إنشاء عرض جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createOffer = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء عرض جديد ===");
    
    const { 
      cityId, 
      establishmentName_ar,
      establishmentName_en, 
      offerName_ar, 
      offerName_en, 
      discountValue, 
      priceBefore, 
      priceAfter, 
      description_ar, 
      description_en, 
      latitude, 
      longitude, 
      establishmentType
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
    if (!cityId || !establishmentName_ar || !establishmentName_en || !offerName_ar || !offerName_en || 
        !discountValue || !priceBefore || !description_ar || !description_en || 
        !establishmentType) {
      const error = new Error('Please provide all required fields: cityId, establishmentName_ar, establishmentName_en, offerName_ar, offerName_en, discountValue, priceBefore, description_ar, description_en, establishmentType.');
      error.status = 400;
      throw error;
    }

    // التحقق من نوع المنشأة
    const validEstablishmentTypes = [
      'Restaurant', 'Cafeteria', 'Hotel', 'Tourist Attraction', 
      'Museum', 'Historical Site', 'Beach Resort', 'Mountain Resort', 
      'Cultural Center', 'Shopping Mall', 'Park', 'Zoo', 
      'Amusement Park', 'Spa & Wellness', 'Casino', 'Nightclub', 
      'Bar', 'Cafe', 'Fast Food', 'Fine Dining', 
      'Local Cuisine', 'Street Food', 'Other'
    ];
    if (establishmentType && !validEstablishmentTypes.includes(establishmentType)) {
      const error = new Error(`Invalid establishment type. Valid types are: ${validEstablishmentTypes.join(', ')}`);
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

    // التحقق من صحة قيمة الخصم
    if (discountValue < 0 || discountValue > 100) {
      const error = new Error('Discount value must be between 0 and 100.');
      error.status = 400;
      throw error;
    }

    // تحويل القيم إلى أرقام
    const discountValuePercent = parseFloat(discountValue);
    const priceBeforeValue = parseFloat(priceBefore);
    
    // حساب السعر بعد الخصم تلقائيًا
    const priceAfterValue = priceBeforeValue - (priceBeforeValue * discountValuePercent / 100);
    
    // التحقق من أن السعر بعد الخصم محسوب بشكل صحيح
    if (priceAfter !== undefined && parseFloat(priceAfter) !== priceAfterValue) {
      console.log(`Warning: Provided priceAfter (${priceAfter}) doesn't match calculated value (${priceAfterValue}). Using calculated value.`);
    }

    // إعداد بيانات العرض
    const offerData = {
      cityId,
      establishmentName_ar,
      establishmentName_en,
      offerName_ar,
      offerName_en,
      discountValue: discountValuePercent,
      priceBefore: priceBeforeValue,
      priceAfter: priceAfterValue,
      description_ar,
      description_en,
      images: uploadedImages, // استخدام الصور المرفوعة
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      establishmentType
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newOffer = await Offer.create(offerData);

    // إضافة معلومات المدينة إلى الاستجابة
    newOffer.dataValues.city = {
      id: city.id,
      name_ar: city.name_ar,
      name_en: city.name_en
    };

    // إضافة ترجمة نوع المنشأة إلى الاستجابة
    if (newOffer.establishmentTypeName) {
      newOffer.dataValues.establishmentType = newOffer.establishmentTypeName;
    }

    console.log(`تم إنشاء العرض بنجاح: ${newOffer.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Offer created successfully.",
      data: newOffer
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
          await safeDeleteOfferFiles(filesToDelete);
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
// 🔹 عرض جميع العروض (للعامة)
// ---------------------------------------------------------
exports.getAllOffers = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 عروض في كل صفحة كطلب
    const offset = (page - 1) * limit;
    
    // الحصول على معرف المدينة من الاستعلام (إن وجد)
    const cityId = req.query.cityId;

    // إعداد خيارات الاستعلام
    const queryOptions = {
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name_ar', 'name_en']
      }],
      order: [['id', 'ASC']],
      limit,
      offset
    };

    // إذا تم توفير معرف المدينة، قم بتصفية العروض حسب المدينة
    if (cityId) {
      queryOptions.where = { cityId: cityId };
    }

    // الحصول على العروض مع التصفح
    const { count, rows: offers } = await Offer.findAndCountAll(queryOptions);

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    // إضافة ترجمة نوع المنشأة إلى كل عرض
    const offersWithTranslations = offers.map(offer => {
      const offerData = offer.toJSON();
      if (offer.establishmentTypeName) {
        offerData.establishmentType = offer.establishmentTypeName;
      }
      return offerData;
    });

    res.status(200).json({
      status: "success",
      message: cityId 
        ? `✅ Offers for city ID ${cityId} retrieved successfully.` 
        : "✅ All offers retrieved successfully.",
      count: offersWithTranslations.length,
      data: offersWithTranslations,
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
// 🔹 عرض عرض محدد بالرقم المعرف (للعامة)
// ---------------------------------------------------------
exports.getOfferById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const offer = await Offer.findByPk(id, {
      include: [{
        model: City,
        as: 'city',
        attributes: ['id', 'name_ar', 'name_en']
      }]
    });

    if (!offer) {
      const error = new Error('Offer not found.');
      error.status = 404;
      throw error;
    }

    // إضافة ترجمة نوع المنشأة إلى الاستجابة
    const offerData = offer.toJSON();
    if (offer.establishmentTypeName) {
      offerData.establishmentType = offer.establishmentTypeName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Offer found.",
      data: offerData
    });
  } catch (error) {
    next(error);
  }
};

 
// ---------------------------------------------------------
// 🔹 تحديث عرض (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updateOffer = async (req, res, next) => {
  let newImages = [];

  try {
    const { id } = req.params;
    const {
      cityId,
      establishmentName_ar,
      establishmentName_en,
      offerName_ar,
      offerName_en,
      discountValue,
      priceBefore,
      priceAfter,
      description_ar,
      description_en,
      latitude,
      longitude,
      establishmentType
    } = req.body;

    console.log("=== تحديث عرض ===");
    console.log("📦 البيانات المستلمة:", req.body);
    console.log("📸 الملفات المرفوعة:", req.dbFiles);

    const offer = await Offer.findByPk(id);
    if (!offer) {
      if (req.dbFiles && (req.dbFiles.image || req.dbFiles.images)) {
        const filesToDelete = [
          ...(req.dbFiles.image || []),
          ...(req.dbFiles.images || [])
        ];
        if (filesToDelete.length > 0) await safeDeleteOfferFiles(filesToDelete);
      }
      const error = new Error("Offer not found.");
      error.status = 404;
      throw error;
    }

    // 🔹 التحقق من وجود المدينة إذا تم تحديثها
    if (cityId) {
      const city = await City.findByPk(cityId);
      if (!city) {
        const error = new Error('City not found.');
        error.status = 404;
        throw error;
      }
    }

    // 🔹 تحديد الصور الجديدة المرفوعة إن وجدت
    if (req.dbFiles) {
      if (Array.isArray(req.dbFiles.images)) newImages = [...req.dbFiles.images];
      else if (typeof req.dbFiles.images === "string") newImages = [req.dbFiles.images];
      else if (Array.isArray(req.dbFiles.image)) newImages = [...req.dbFiles.image];
      else if (typeof req.dbFiles.image === "string") newImages = [req.dbFiles.image];
    }

    // 🔹 تحضير بيانات التحديث
    const updateData = {
      cityId: cityId || offer.cityId,
      establishmentName_ar: establishmentName_ar || offer.establishmentName_ar,
      establishmentName_en: establishmentName_en || offer.establishmentName_en,
      offerName_ar: offerName_ar || offer.offerName_ar,
      offerName_en: offerName_en || offer.offerName_en,
      description_ar: description_ar || offer.description_ar,
      description_en: description_en || offer.description_en,
      latitude: latitude ? parseFloat(latitude) : offer.latitude,
      longitude: longitude ? parseFloat(longitude) : offer.longitude,
      establishmentType: establishmentType || offer.establishmentType
    };

    // تحديث قيمة الخصم إذا تم تقديمها
    if (discountValue !== undefined) {
      const discountValuePercent = parseFloat(discountValue);
      // التحقق من صحة قيمة الخصم
      if (discountValuePercent < 0 || discountValuePercent > 100) {
        const error = new Error('Discount value must be between 0 and 100.');
        error.status = 400;
        throw error;
      }
      updateData.discountValue = discountValuePercent;
    }

    // تحديث السعر قبل الخصم إذا تم تقديمها
    let priceBeforeValue = offer.priceBefore;
    if (priceBefore !== undefined) {
      priceBeforeValue = parseFloat(priceBefore);
      updateData.priceBefore = priceBeforeValue;
    }

    // إذا تم تحديث قيمة الخصم أو السعر قبل الخصم، أعد حساب السعر بعد الخصم
    if (discountValue !== undefined || priceBefore !== undefined) {
      const currentDiscountValue = updateData.discountValue !== undefined ? updateData.discountValue : offer.discountValue;
      const priceAfterValue = priceBeforeValue - (priceBeforeValue * currentDiscountValue / 100);
      updateData.priceAfter = priceAfterValue;
    } else if (priceAfter !== undefined) {
      // إذا تم تقديم السعر بعد الخصم فقط، استخدمه
      updateData.priceAfter = parseFloat(priceAfter);
    }

    // التحقق من أن السعر بعد الخصم أقل من السعر قبل الخصم
    const updatedPriceBefore = updateData.priceBefore !== undefined ? updateData.priceBefore : offer.priceBefore;
    const updatedPriceAfter = updateData.priceAfter !== undefined ? updateData.priceAfter : offer.priceAfter;
    if (updatedPriceAfter >= updatedPriceBefore) {
      const error = new Error('Price after discount must be less than price before discount.');
      error.status = 400;
      throw error;
    }

    // التحقق من نوع المنشأة إذا تم تحديثه
    if (establishmentType) {
      const validEstablishmentTypes = [
        'Restaurant', 'Cafeteria', 'Hotel', 'Tourist Attraction', 
        'Museum', 'Historical Site', 'Beach Resort', 'Mountain Resort', 
        'Cultural Center', 'Shopping Mall', 'Park', 'Zoo', 
        'Amusement Park', 'Spa & Wellness', 'Casino', 'Nightclub', 
        'Bar', 'Cafe', 'Fast Food', 'Fine Dining', 
        'Local Cuisine', 'Street Food', 'Other'
      ];
      if (!validEstablishmentTypes.includes(establishmentType)) {
        const error = new Error(`Invalid establishment type. Valid types are: ${validEstablishmentTypes.join(', ')}`);
        error.status = 400;
        throw error;
      }
    }

    // ===========================================================
    // ✅ حذف الصور القديمة إذا تم رفع ملفات جديدة
    // ===========================================================
    if (newImages.length > 0) {
      console.log("📸 الصور الجديدة:", newImages);
      console.log("📸 الصور القديمة (خام):", offer.images);

      let oldImages = [];
      if (Array.isArray(offer.images)) oldImages = [...offer.images];
      else if (typeof offer.images === "string") {
        try {
          oldImages = JSON.parse(offer.images);
        } catch (e) {
          console.warn("⚠️ تعذر تحليل الصور القديمة:", e);
        }
      }

      if (oldImages.length > 0) {
        try {
          console.log("🗑️ محاولة حذف الصور القديمة:", oldImages);
          await safeDeleteOfferFiles(oldImages);
        } catch (err) {
          console.error("❌ خطأ أثناء حذف الصور القديمة:", err);
        }
      }

      updateData.images = newImages;
    } else {
      updateData.images = offer.images || [];
      console.log("📦 الاحتفاظ بالصور القديمة:", offer.images);
    }

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedOffer = await offer.update(updateData);

    // إضافة معلومات المدينة إلى الاستجابة
    const city = await City.findByPk(updatedOffer.cityId);
    if (city) {
      updatedOffer.dataValues.city = {
        id: city.id,
        name_ar: city.name_ar,
        name_en: city.name_en
      };
    }

    // إضافة ترجمة نوع المنشأة إلى الاستجابة
    if (updatedOffer.establishmentTypeName) {
      updatedOffer.dataValues.establishmentType = updatedOffer.establishmentTypeName;
    }

    res.status(200).json({
      status: "success",
      message: "✅ Offer updated successfully.",
      data: updatedOffer
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
        await safeDeleteOfferFiles(newImages);
        console.log("🗑️ تم حذف الصور الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور الجديدة:", deleteError);
      }
    }

    next(error);
  }
};


// ---------------------------------------------------------
// 🔹 حذف عرض (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findByPk(id);

    if (!offer) {
      return res.status(404).json({
        status: "failure",
        message: "Offer not found.",
      });
    }

    // 🔹 التحقق من وجود صور مرتبطة بالعرض
    let offerImages = [];
    if (Array.isArray(offer.images)) {
      offerImages = [...offer.images];
    } else if (typeof offer.images === "string") {
      try {
        offerImages = JSON.parse(offer.images);
      } catch {
        offerImages = [];
      }
    }

    // 🔹 حذف الصور القديمة إن وجدت
    if (offerImages.length > 0) {
      try {
        console.log("🗑️ حذف صور العرض:", offerImages);
        await safeDeleteOfferFiles(offerImages);
      } catch (err) {
        console.error("❌ خطأ في حذف صور العرض:", err);
      }
    }

    await offer.destroy();

    res.status(200).json({
      status: "success",
      message: "🗑️ Offer deleted successfully.",
    });
  } catch (error) {
    console.error("Error in deleteOffer:", error);
    next(error);
  }
};
