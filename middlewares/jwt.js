const { expressjwt: expjwt } = require("express-jwt");
const Token = require("../models/tokenModel");
const config = require("../config"); // ملف الإعدادات

function authJwt() {
  const API = config.API;
  return expjwt({
    // استخدم السر من ملف الإعدادات (للتناسق)
    secret: config.ACCESS_TOKEN_SECRET,
    algorithms: ["HS256"],
    isRevoked: isRevoked,
    requestProperty: "auth", // ضع بيانات التوكن مباشرة في req.auth
  }).unless({
    path: [
      `${API}/login`,
      `${API}/login/`,
      `${API}/login-social`,
      `${API}/login-social/`,
      `${API}/firebase-login`,
      `${API}/firebase-login/`,
      `${API}/register`,
      `${API}/register/`,
      `${API}/forgot-password`,
      `${API}/forgot-password/`,
      `${API}/verify-token`,
      `${API}/verify-token/`,
      `${API}/verify-otp`,
      `${API}/verify-otp/`,
      `${API}/reset-password`,
      `${API}/reset-password/`,
      `${API}/api-docs/`,

      // السماح بالوصول العام للملفات الثابتة (الصور والفيديو) بدون توكن
      { url: /^\/public\/.*/i, methods: ["GET", "HEAD"] },
      { url: /^\/uploads\/.*/i, methods: ["GET", "HEAD"] },
      
      // Public routes for posts (without /api/v1 prefix)
      { url: /^\/posts\/[0-9a-fA-F]{24}$/, methods: ["GET"] },

      // Allow public read-only access for best posts and stories feed
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/posts/best/.*`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/stories/feed$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/tags`, "i"),
        methods: ["GET"],
      },
      // Public GET: list and single post by id (exclude /me routes)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/posts$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/posts/[0-9a-fA-F]{24}$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Open Graph pages for social sharing (no auth required)
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/posts/[0-9a-fA-F]{24}/og$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Share endpoint (no auth required for social sharing)
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/posts/[0-9a-fA-F]{24}/share$`,
          "i"
        ),
        methods: ["POST"],
      },
      // Public user profile endpoint (no auth required)
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/users/[0-9a-fA-F]{24}$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public user profile endpoint by username (no auth required)
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/users/[a-zA-Z0-9._-]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public emergency services endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/emergency-services$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/emergency-services/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public new-events endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/new-events/exhibitions$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/new-events/exhibitions/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/new-events/festivals-events$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/new-events/festivals-events/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public owner contact endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/owner-contact$`, "i"),
        methods: ["GET"],
      },
      // Public feedback submission endpoint (no auth required for POST requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/feedback$`, "i"),
        methods: ["POST"],
      },
      // Public visa types endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/visa-types$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/visa-types/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public offers endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/offers$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/offers/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public arts and culture endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/arts-culture$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/arts-culture/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public cafeterias endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/food-drinks/cafeterias$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/food-drinks/cafeterias/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public explore endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/explore$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/explore/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public experiences endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/experiences$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/experiences/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public public transport endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/public-transport$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/public-transport/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public restaurants endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/food-drinks/restaurants$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/food-drinks/restaurants/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
      // Public tour guides endpoints (no auth required for GET requests)
      {
        url: new RegExp(`^${API.replace(/\//g, "\\/")}/tour-guides$`, "i"),
        methods: ["GET"],
      },
      {
        url: new RegExp(
          `^${API.replace(/\//g, "\\/")}/tour-guides/[0-9]+$`,
          "i"
        ),
        methods: ["GET"],
      },
    ],
  });
}

async function isRevoked(req, payload) {
  // Add logging to help diagnose the issue
  console.log("JWT isRevoked check:", {
    hasAuthHeader: !!req.header("Authorization"),
    originalUrl: req.originalUrl,
    isAdminRoute: /^\/api\/v1\/admin\//i.test(req.originalUrl),
    payload: payload,
    reqAuth: req.auth
  });
  
  // تأكد من وجود Header قبل الاستدعاء
  const authHeader = req.header("Authorization");
  if (!authHeader) return true; // منع الوصول إن لم يكن هناك header

  if (!authHeader.startsWith("Bearer ")) {
    return true;
  }

  // استخراج الـ access token بدقة (قيمة الـ header بعد "Bearer ")
  const accessToken = authHeader.slice(7).trim();

  try {
    // البحث عن السجل في قاعدة البيانات (تأكد أن الحقل في DB اسمُه accessToken)
    const token = await Token.findOne({ where: { accessToken } });
    
    // Extract the actual payload data from the JWT token
    // The payload parameter is a decoded JWT object with header, payload, and signature properties
    const tokenData = payload && payload.payload ? payload.payload : (req.auth || payload);
    
    // التحقق من مسارات الإدارة باستخدام Regex (يمكن تعديل المسار إذا اختلف)
    const adminRouteRegx = /^\/api\/v1\/admin\//i;
    const isAdminRoute = adminRouteRegx.test(req.originalUrl);
    const adminFault = !tokenData.isAdmin && isAdminRoute;

    // إذا كان المستخدم يحاول الوصول لمسار إداري بدون صلاحية => إرسال رسالة خطأ واضحة
    if (adminFault) {
      // إضافة خاصية مخصصة للطلب للإشارة إلى خطأ الوصول الإداري
      req.isAdminAccessDenied = true;
      console.log("Admin access denied for user:", {
        userId: tokenData.id,
        isAdmin: tokenData.isAdmin,
        route: req.originalUrl
      });
    }

    // إذا لم يوجد توكن في DB أو المستخدم يحاول الوصول لمسار إداري بدون صلاحية => ملغي
    const isRevoked = adminFault || !token;
    console.log("Token is revoked:", isRevoked, {
      adminFault,
      tokenFound: !!token
    });
    
    return isRevoked;
  } catch (error) {
    console.error("Database error in isRevoked function:", error);
    // In case of database error, we'll allow the request to proceed to the next middleware
    // which will handle the error appropriately
    return false;
  }
}

module.exports = authJwt;
