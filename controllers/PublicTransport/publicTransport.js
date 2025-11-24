/*
ملف وحدة تحكم Public Transport (publicTransport.js)
--------------------------------------------
وظيفة الملف:
- يحتوي على جميع العمليات المتعلقة بوسائل المواصلات العامة
- يتعامل مع إنشاء، قراءة، تحديث، وحذف وسائل المواصلات العامة
- يربط بين طلبات المستخدم ونموذج PublicTransport
*/

// استيراد نموذج PublicTransport
const PublicTransport = require('../../models/publicTransportModel');

// استيراد نموذج المدينة
const City = require('../../models/cityModel');

// استيراد دوال مساعدة للوسائط
const { handleUploadError } = require("../services/mediaHelper");

// دالة آمنة لحذف ملفات PublicTransport
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeletePublicTransportFiles = async (fileIdentifiers = []) => {
  try {
    console.log("محاولة حذف الملفات:", fileIdentifiers);
    console.log("نوع معرفات الملفات:", typeof fileIdentifiers);
    console.log("هل معرفات الملفات مصفوفة:", Array.isArray(fileIdentifiers));
    
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
        console.log("عنصر غير نصي في المصفوفة:", fileIdentifiers[i], "النوع:", typeof fileIdentifiers[i]);
        return {
          success: false,
          message: "Invalid file identifier type",
          error: "File identifiers must be strings"
        };
      }
    }
    
    // استيراد دالة حذف ملفات متعددة
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    
    console.log("استدعاء دالة حذف الملفات مع نوع المحتوى: public_transport");
    // حذف الملفات بإدخال نوع المحتوى "public_transport" (مع underscore كما هو مستخدم عند الرفع)
    const result = await deleteMultipleFiles(fileIdentifiers, "public_transport");
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
// 🔹 إنشاء سجل PublicTransport جديد (للمسؤولين فقط)
// ---------------------------------------------------------
exports.createPublicTransport = async (req, res, next) => {
  // تعريف المتغيرات خارج كتلة try لضمان الوصول إليها في كتلة catch
  let uploadedImages = [];
  
  try {
    console.log("=== إنشاء سجل PublicTransport جديد ===");
    
    const { name_ar, name_en, description_ar, description_en, paymentMethods } = req.body;

    console.log("البيانات المستلمة:", req.body);
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
    if (!name_ar || !name_en || !description_ar || !description_en || !paymentMethods) {
      const error = new Error('Please provide all required fields: name_ar, name_en, description_ar, description_en, paymentMethods.');
      error.status = 400;
      throw error;
    }

    // إعداد بيانات PublicTransport
    const publicTransportData = {
      name_ar,
      name_en,
      description_ar,
      description_en,
      images: uploadedImages, // استخدام الصور المرفوعة
      paymentMethods: paymentMethods || 'Prepaid_Transport_Cards'
    };

    // إنشاء سجل جديد في قاعدة البيانات
    const newPublicTransport = await PublicTransport.create(publicTransportData);

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: newPublicTransport.id,
      name_ar: newPublicTransport.name_ar,
      name_en: newPublicTransport.name_en,
      description_ar: newPublicTransport.description_ar,
      description_en: newPublicTransport.description_en,
      images: newPublicTransport.images,
      paymentMethodsName: newPublicTransport.paymentMethodsName,
      createdAt: newPublicTransport.createdAt,
      updatedAt: newPublicTransport.updatedAt
    };

    console.log(`تم إنشاء سجل PublicTransport بنجاح: ${newPublicTransport.id}`);

    res.status(201).json({
      status: "success",
      message: "✅ Public Transport record created successfully.",
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
        await safeDeletePublicTransportFiles(uploadedImages);
        console.log('تم حذف الملفات المرفوعة بعد حدوث خطأ');
      } catch (deleteError) {
        console.error('خطأ في حذف الملفات المرفوعة:', deleteError);
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 عرض جميع سجلات PublicTransport
// ---------------------------------------------------------
exports.getAllPublicTransports = async (req, res, next) => {
  try {
    // الحصول على معلمات الصفحة والحد من الطلب
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10; // 10 سجلات في كل صفحة كطلب
    const offset = (page - 1) * limit;

    // الحصول على السجلات مع التصفح
    const { count, rows: publicTransports } = await PublicTransport.findAndCountAll({
      order: [['id', 'ASC']],
      limit,
      offset
    });

    // إنشاء كائن نظيف للنتائج بدون التكرار
    const result = publicTransports.map(publicTransport => ({
      id: publicTransport.id,
      name_ar: publicTransport.name_ar,
      name_en: publicTransport.name_en,
      description_ar: publicTransport.description_ar,
      description_en: publicTransport.description_en,
      images: publicTransport.images,
      paymentMethodsName: publicTransport.paymentMethodsName,
      createdAt: publicTransport.createdAt,
      updatedAt: publicTransport.updatedAt
    }));

    // حساب عدد الصفحات الإجمالي
    const totalPages = Math.ceil(count / limit);

    res.status(200).json({
      status: "success",
      message: "✅ All Public Transport records retrieved successfully.",
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
// 🔹 عرض سجل PublicTransport محدد بالرقم المعرف
// ---------------------------------------------------------
exports.getPublicTransportById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const publicTransport = await PublicTransport.findByPk(id);

    if (!publicTransport) {
      const error = new Error('Public Transport record not found.');
      error.status = 404;
      throw error;
    }

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: publicTransport.id,
      name_ar: publicTransport.name_ar,
      name_en: publicTransport.name_en,
      description_ar: publicTransport.description_ar,
      description_en: publicTransport.description_en,
      images: publicTransport.images,
      paymentMethodsName: publicTransport.paymentMethodsName,
      createdAt: publicTransport.createdAt,
      updatedAt: publicTransport.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Public Transport record found.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 تحديث سجل PublicTransport (للمسؤولين فقط)
// ---------------------------------------------------------
exports.updatePublicTransport = async (req, res, next) => {
  let newImages = [];

  try {
    const { id } = req.params;
    const {
      name_ar,
      name_en,
      description_ar,
      description_en,
      paymentMethods
    } = req.body;

    console.log("=== تحديث سجل PublicTransport ===");
    console.log("البيانات المستلمة:", req.body);
    console.log("الملفات المرفوعة:", req.dbFiles);

    const publicTransport = await PublicTransport.findByPk(id);
    if (!publicTransport) {
      if (req.dbFiles && req.dbFiles.images) {
        await safeDeletePublicTransportFiles(
          Array.isArray(req.dbFiles.images)
            ? req.dbFiles.images
            : [req.dbFiles.images]
        );
      }
      const error = new Error("Public Transport record not found.");
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

    // 🔹 تحضير بيانات التحديث
    const updateData = {
      name_ar: name_ar || publicTransport.name_ar,
      name_en: name_en || publicTransport.name_en,
      description_ar: description_ar || publicTransport.description_ar,
      description_en: description_en || publicTransport.description_en,
      paymentMethods: paymentMethods || publicTransport.paymentMethods
    };

    // ===========================================================
    // ✅ حذف الصور القديمة إذا تم رفع صور جديدة
    // ===========================================================
    if (newImages.length > 0) {
      console.log("📸 الصور الجديدة:", newImages);
      console.log("📸 الصور القديمة (خام):", publicTransport.images);
      console.log("📸 نوع الصور القديمة:", typeof publicTransport.images);
      console.log("📸 هل الصور القديمة مصفوفة:", Array.isArray(publicTransport.images));

      // تجهيز مصفوفة الصور القديمة للحذف
      let oldImages = [];
      if (Array.isArray(publicTransport.images)) {
        oldImages = [...publicTransport.images];
        console.log("📸 تم نسخ الصور القديمة كمصفوفة:", oldImages);
      } else if (typeof publicTransport.images === "string") {
        try {
          oldImages = JSON.parse(publicTransport.images);
          console.log("📸 تم تحليل الصور القديمة من نص JSON:", oldImages);
        } catch (parseError) {
          console.warn("⚠️ تعذر تحليل الصور القديمة:", parseError);
          oldImages = [];
        }
      } else {
        console.log("📸 نوع غير متوقع للصور القديمة:", typeof publicTransport.images);
        oldImages = [];
      }

      // حذف الصور القديمة إن وجدت
      if (oldImages.length > 0) {
        try {
          console.log("🗑️ محاولة حذف الصور القديمة:", oldImages);
          const deleteResult = await safeDeletePublicTransportFiles(oldImages);
          console.log("نتيجة حذف الصور القديمة:", deleteResult);
        } catch (deleteError) {
          console.error("❌ خطأ في حذف الصور القديمة:", deleteError);
        }
      } else {
        console.log("🗑️ لا توجد صور قديمة لحذفها");
      }

      // تعيين الصور الجديدة
      updateData.images = newImages;
      console.log("✅ تم تعيين الصور الجديدة:", newImages);
    } else {
      updateData.images = publicTransport.images || [];
      console.log("📦 الاحتفاظ بالصور القديمة:", publicTransport.images);
    }

    // ===========================================================
    // ✅ تنفيذ عملية التحديث في قاعدة البيانات
    // ===========================================================
    const updatedPublicTransport = await publicTransport.update(updateData);

    // إنشاء كائن نظيف للنتيجة بدون التكرار
    const result = {
      id: updatedPublicTransport.id,
      name_ar: updatedPublicTransport.name_ar,
      name_en: updatedPublicTransport.name_en,
      description_ar: updatedPublicTransport.description_ar,
      description_en: updatedPublicTransport.description_en,
      images: updatedPublicTransport.images,
      paymentMethodsName: updatedPublicTransport.paymentMethodsName,
      createdAt: updatedPublicTransport.createdAt,
      updatedAt: updatedPublicTransport.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ Public Transport record updated successfully.",
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
        await safeDeletePublicTransportFiles(newImages);
        console.log("🗑️ تم حذف الصور الجديدة بعد فشل العملية");
      } catch (deleteError) {
        console.error("❌ خطأ أثناء حذف الصور الجديدة:", deleteError);
      }
    }

    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 حذف سجل PublicTransport (للمسؤولين فقط)
// ---------------------------------------------------------
exports.deletePublicTransport = async (req, res, next) => {
  try {
    const { id } = req.params;

    // البحث عن السجل المطلوب حذفه
    const publicTransport = await PublicTransport.findByPk(id);
    if (!publicTransport) {
      return res.status(404).json({
        status: "failure",
        message: "Public Transport record not found.",
      });
    }

    // 🔹 التحقق من وجود صور مرتبطة بالسجل
    let publicTransportImages = [];
    if (Array.isArray(publicTransport.images)) {
      publicTransportImages = [...publicTransport.images];
    } else if (typeof publicTransport.images === "string") {
      try {
        publicTransportImages = JSON.parse(publicTransport.images);
      } catch (parseError) {
        publicTransportImages = [];
      }
    }

    // 🔹 حذف الصور القديمة إن وجدت
    if (publicTransportImages && Array.isArray(publicTransportImages) && publicTransportImages.length > 0) {
      try {
        console.log("🗑️ حذف صور PublicTransport:", publicTransportImages);
        await safeDeletePublicTransportFiles(publicTransportImages);
      } catch (err) {
        console.error("❌ خطأ في حذف صور PublicTransport:", err);
      }
    }

    // 🔹 حذف السجل نفسه من قاعدة البيانات
    await publicTransport.destroy();

    // 🔹 إرسال الرد النهائي
    res.status(200).json({
      status: "success",
      message: "🗑️ Public Transport record deleted successfully."
    });

  } catch (error) {
    console.error("Error in deletePublicTransport:", error);
    next(error);
  }
};