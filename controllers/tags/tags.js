// controllers/tags/tags.js
// CRUD لإدارة الوسوم (Tags)
// ملاحظات:
// - لا يوجد رفع ملفات هنا. أي رفع/حذف للصور يجب أن يكون عبر المسارات (Routes) إن وجد مستقبلًا.
// - نولّد slug تلقائيًا من nameEn أو nameAr إذا لم يُمرّر.
// - نحافظ على تعليقات عربية لسهولة الفهم.

const { Tag } = require("../../models");
const sequelize = require("../../models/sequelize");
const { cleanupDeletedTagReferences } = require("../posts/posts"); // Import the cleanup function
const { cleanupDeletedTagReferencesInStories } = require("../stories/stories"); // Import the cleanup function for stories

// دالة مساعدة بسيطة لتوليد slug من نص إنجليزي أو عربي
function slugify(value = "") {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // استبدال المسافات بشرطة
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "-") // إزالة الرموز الخاصة مع دعم العربية
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// إنشاء وسم جديد
exports.create = async (req, res, next) => {
  try {
    const { nameAr, nameEn, slug } = req.body;

    const finalSlug = slug?.trim() || slugify(nameEn || nameAr);

    const doc = await Tag.create({ nameAr, nameEn, slug: finalSlug });
    res.status(201).json({ status: "success", data: doc });
  } catch (e) {
    next(e);
  }
};

// قائمة الوسوم (مع ترقيم)
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, q } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    
    // Build where clause
    const where = {};
    if (q) {
      // بحث بسيط بالاسم العربي أو الإنجليزي
      where[sequelize.Op.or] = [
        { nameAr: { [sequelize.Op.like]: `%${q}%` } },
        { nameEn: { [sequelize.Op.like]: `%${q}%` } },
      ];
    }

    const { rows: items, count: total } = await Tag.findAndCountAll({
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

// جلب وسم عبر المعرّف أو الـ slug
exports.get = async (req, res, next) => {
  try {
    const { id } = req.params;
    let doc = null;
    
    if (id.match(/^[0-9]+$/)) {
      doc = await Tag.findByPk(id);
    } else {
      doc = await Tag.findOne({ where: { slug: id } });
    }

    if (!doc) {
      const error = new Error("Tag not found");
      error.status = 404;
      throw error;
    }
    res.json({ status: "success", data: doc });
  } catch (e) {
    next(e);
  }
};

// تحديث وسم
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, slug } = req.body;

    const doc = await Tag.findByPk(id);
    
    if (!doc) {
      const error = new Error("Tag not found");
      error.status = 404;
      throw error;
    }
    
    // تحديث الحقول واحدة تلو الأخرى للتأكد من تفعيل الـ hooks
    if (nameAr !== undefined) doc.nameAr = nameAr;
    if (nameEn !== undefined) doc.nameEn = nameEn;
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

// حذف وسم
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    // دعم الحذف بالـ ObjectId أو الـ slug
    let tag;
    if (id.match(/^[0-9]+$/)) {
      tag = await Tag.findByPk(id);
    } else {
      tag = await Tag.findOne({ where: { slug: id } });
    }

    if (!tag) {
      const error = new Error("Tag not found");
      error.status = 404;
      throw error;
    }

    // منع حذف التاغ الافتراضي
    if (tag.slug === "unknown") {
      const error = new Error("Cannot delete 'unknown' tag");
      error.status = 400;
      throw error;
    }

    // حفظ معرف الوسم قبل حذفه
    const tagId = tag.id;

    // حذف الوسم
    await tag.destroy();
    
    // تنظيف المراجع في جدول البوستات
    await cleanupDeletedTagReferences(tagId);
    
    // تنظيف المراجع في جدول الستوريز
    await cleanupDeletedTagReferencesInStories(tagId);

    res.json({
      status: "success",
      message: "Tag deleted",
    });
  } catch (e) {
    next(e);
  }
};