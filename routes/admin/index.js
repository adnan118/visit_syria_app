/*
ملف مسارات الإدارة (admin/index.js)
---------------------------------
- يحتوي على جميع مسارات لوحة الإدارة
- يتطلب صلاحيات إدارية للوصول لهذه المسارات
*/

const express = require("express");
const router = express.Router();

// استيراد مسارات الإدارة الفرعية
const adminUsersRoutes = require("./users");
const adminPostsRoutes = require("./posts");
const adminEmergencyServicesRoutes = require("./emergencyServices");
const adminExhibitionsRoutes = require("./exhibitions");
const adminFestivalsEventsRoutes = require("./festivalsEvents");
const adminTourGuidesRoutes = require("./tourGuides");
const adminExperiencesRoutes = require("./experiences");
const adminExploreRoutes = require("./explore");
const adminPublicTransportRoutes = require("./publicTransport");
const adminOwnerContactRoutes = require("./ownerContact");
const adminFeedbackRoutes = require("./feedback");
const adminVisaTypesRoutes = require("./visaTypes");
const adminRestaurantsRoutes = require("./restaurants");
const adminCafeteriasRoutes = require("./cafeterias");
const adminArtsCultureRoutes = require("./artsCulture");
const adminOffersRoutes = require("./offers");

// استخدام مسارات إدارة المستخدمين
router.use("/users", adminUsersRoutes);

// استخدام مسارات إدارة المنشورات
router.use("/posts", adminPostsRoutes);

// استخدام مسارات إدارة خدمات الطوارئ
router.use("/emergency-services", adminEmergencyServicesRoutes);

// استخدام مسارات إدارة المعارض
router.use("/exhibitions", adminExhibitionsRoutes);

// استخدام مسارات إدارة المهرجانات والأحداث
router.use("/festivals-events", adminFestivalsEventsRoutes);

// استخدام مسارات إدارة المرشدين السياحيين
router.use("/tour-guides", adminTourGuidesRoutes);

// استخدام مسارات إدارة التجارب
router.use("/experiences", adminExperiencesRoutes);

// استخدام مسارات إدارة Explore
router.use("/explore", adminExploreRoutes);

// استخدام مسارات إدارة وسائل المواصلات العامة
router.use("/public-transport", adminPublicTransportRoutes);

// استخدام مسارات إدارة معلومات تواصل المالك
router.use("/owner-contact", adminOwnerContactRoutes);

// استخدام مسارات إدارة ملاحظات المستخدمين
router.use("/feedback", adminFeedbackRoutes);

// استخدام مسارات إدارة أنواع التأشيرات
router.use("/visa-types", adminVisaTypesRoutes);

// استخدام مسارات إدارة المطاعم
router.use("/restaurants", adminRestaurantsRoutes);

// استخدام مسارات إدارة الكافتيريا
router.use("/cafeterias", adminCafeteriasRoutes);

// استخدام مسارات إدارة الفنون والثقافة
router.use("/arts-culture", adminArtsCultureRoutes);

// استخدام مسارات إدارة العروض
router.use("/offers", adminOffersRoutes);

module.exports = router;
