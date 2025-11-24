// controllers/services/servicesController.js
// CRUD لإدارة الخدمات (Services)
// - لا يوجد رفع وسائط هنا. يمكن إضافة أيقونة لاحقًا عبر رفع ملفات من المسارات إذا لزم.

const { Service } = require("../../models");
const sequelize = require("../../models/sequelize");
const { cleanupDeletedServiceReferences } = require("../posts/posts"); // Import the cleanup function

function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// إنشاء خدمة
exports.create = async (req, res, next) => {
  try {
    const { nameAr, nameEn, slug, icon } = req.body;
    const finalSlug = slug?.trim() || slugify(nameEn || nameAr);
    const doc = await Service.create({ nameAr, nameEn, slug: finalSlug, icon });
    res.status(201).json({ status: "success", data: doc });
  } catch (e) {
    next(e);
  }
};

// قائمة الخدمات
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where = {};
    if (q) {
      where[sequelize.Op.or] = [
        { nameAr: { [sequelize.Op.like]: `%${q}%` } },
        { nameEn: { [sequelize.Op.like]: `%${q}%` } },
      ];
    }

    const { rows: items, count: total } = await Service.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      status: "success",
      data: items,
      meta: { page: Number(page), limit: Number(limit), total },
    });
  } catch (e) {
    next(e);
  }
};

// جلب خدمة (id أو slug)
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doc = null;
    
    if (id.match(/^[0-9]+$/)) {
      doc = await Service.findByPk(id);
    } else {
      doc = await Service.findOne({ where: { slug: id } });
    }
    
    if (!doc)
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });
    res.json({ status: "success", data: doc });
  } catch (e) {
    next(e);
  }
};

// تحديث خدمة
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, slug, icon } = req.body;

    const doc = await Service.findByPk(id);
    if (!doc)
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });
    
    // تحديث الحقول واحدة تلو الأخرى للتأكد من تفعيل الـ hooks
    if (nameAr !== undefined) doc.nameAr = nameAr;
    if (nameEn !== undefined) doc.nameEn = nameEn;
    if (icon !== undefined) doc.icon = icon;
    if (slug !== undefined) {
      doc.slug = slug.trim() || slugify(nameEn || nameAr || "");
    }
    
    // حفظ التحديث لتفعيل الـ hooks
    await doc.save();
    
    res.json({ status: "success", data: doc });
  } catch (e) {
    next(e);
  }
};

// حذف خدمة
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // دعم الحذف بالـ ObjectId أو الـ slug
    let service;
    if (id.match(/^[0-9]+$/)) {
      service = await Service.findByPk(id);
    } else {
      service = await Service.findOne({ where: { slug: id } });
    }

    if (!service)
      return res
        .status(404)
        .json({ status: "error", message: "Service not found" });

    // منع حذف الخدمة الافتراضية
    if (service.slug === "unknown")
      return res
        .status(400)
        .json({ status: "error", message: "Cannot delete 'unknown' service" });

    // حفظ معرف الخدمة قبل حذفها
    const serviceId = service.id;

    // حذف الخدمة
    await service.destroy();
    
    // تنظيف المراجع في جدول البوستات
    await cleanupDeletedServiceReferences(serviceId);

    res.json({
      status: "success",
      message: "Service deleted",
    });
  } catch (e) {
    next(e);
  }
};