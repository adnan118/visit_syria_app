/*
ملف مسارات التوثيق (auth.js)
----------------------------
- يعرّف جميع المسارات الخاصة بالمصادقة (Authentication).
- يشمل:
  1. التسجيل (Register) بالحساب المحلي أو عبر Google/Facebook.
  2. تسجيل الدخول (Login) باستخدام البريد الإلكتروني أو رقم الهاتف.
  3. استعادة كلمة المرور وتغييرها.
  4. التحقق من صلاحية التوكن (Verify Token).
*/

const express = require("express");
const router = express.Router();

// استيراد وحدة التحكم الخاصة بالمصادقة
const authController = require("../controllers/auth/auth");
const {
  downloadImageFromUrlToUploads,
} = require("../controllers/services/mediaHelper");

// استيراد أدوات التحقق من مكتبة express-validator
const { body, validationResult } = require("express-validator");

/* 
التحقق من صحة بيانات التسجيل
----------------------------
*/
const validateRegister = [
  body("firstName").not().isEmpty().withMessage("First name is required"),

  body("lastName").not().isEmpty().withMessage("Last name is required"),

  body("email").isEmail().withMessage("Please enter a valid email"),

  body("mobile")
    .matches(/^[0-9]{9,15}$/)
    .withMessage("Please enter a valid phone"),

  // كلمة المرور مطلوبة وقوية إذا provider = local (أو عندما لا يُحدد provider - الافتراضي)
  body("password")
    .if((value, { req }) => !req.body.provider || req.body.provider === "local")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol"
    ),
];

/* 
التحقق من صحة بيانات تسجيل الدخول
--------------------------------
*/
const validateLogin = [
  // التحقق أن واحد فقط من email أو mobile موجود
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.mobile) {
      throw new Error("Either email or mobile is required");
    }
    return true;
  }),

  // التحقق من email إن وُجد
  body("email").optional().isEmail().withMessage("Please enter a valid email"),

  // التحقق من mobile إن وُجد
  body("mobile")
    .optional()
    .isLength({ min: 9, max: 15 })
    .withMessage("Mobile number must be between 9 and 15 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Mobile number must contain only digits"),

  // كلمة المرور مطلوبة إذا كان provider = local
  body("password")
    .if(body("provider").equals("local"))
    .not()
    .isEmpty()
    .withMessage("Password is required for local login"),
];

// Middleware لمعالجة أخطاء التحقق
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map((error) => ({
      field: error.path,
      message: error.msg,
    }));
    const error = new Error("Validation errors");
    error.status = 400;
    error.errors = errorMsg;
    return next(error);
  }
  next();
};

/*
التحقق عند تغيير كلمة المرور
----------------------------
*/
const validatePassword = [
  // التحقق أن واحد فقط من email أو mobile موجود
  body().custom((value, { req }) => {
    if (!req.body.email && !req.body.mobile) {
      throw new Error("Either email or mobile is required");
    }
    return true;
  }),

  body("email").optional().isEmail().withMessage("Please enter a valid email"),

  body("mobile")
    .optional()
    .isLength({ min: 9, max: 15 })
    .withMessage("Mobile number must be between 9 and 15 digits")
    .matches(/^[0-9]+$/)
    .withMessage("Mobile number must contain only digits"),

  // كلمة المرور الجديدة
  body("newPassword")
    .isStrongPassword({
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    })
    .withMessage(
      "Password must be at least 8 characters and contain uppercase, lowercase, number, and symbol"
    ),
];

// مسار تسجيل دخول
router.post(
  "/login",
  validateLogin,
  handleValidationErrors,
  authController.login
);

const validateSocialLogin = [
  body("provider").notEmpty().withMessage("Provider required"),
  body("token").notEmpty().withMessage("Token required"),
];

// تنزيل صورة البروفايل (إن وُجدت) قبل وصول الطلب لوحدة التحكم
const prefetchSocialImage = async (req, res, next) => {
  try {
    const raw = req.body || {};
    const oauth = raw.oauth || {};
    const picture =
      oauth.picture || raw.image || raw.picture?.data?.url || raw.picture || "";

    if (picture && /^https?:\/\//i.test(picture)) {
      const stored = await downloadImageFromUrlToUploads(picture, {
        contentType: "users",
        subfolder: "images",
        fileNamePrefix: "user_",
        compress: true,
      });
      if (stored) {
        // خزن فقط اسم الملف لاستخدامه داخل وحدة التحكم
        req.prefetchedUserImage = String(stored).split("/").pop();
      }
    }
    next();
  } catch (e) {
    // عدم إيقاف المصادقة لو فشل تنزيل الصورة
    next();
  }
};

router.post(
  "/login-social",
  validateSocialLogin,
  handleValidationErrors,
  prefetchSocialImage,
  authController.socialLogin
);

// مسار تسجيل الدخول عبر Firebase (Google/Facebook)
const validateFirebaseLogin = [
  body("idToken")
    .notEmpty()
    .withMessage("Firebase ID token is required")
    .isLength({ min: 10 })
    .withMessage("Invalid Firebase ID token format"),
];

router.post(
  "/firebase-login",
  validateFirebaseLogin,
  handleValidationErrors,
  authController.firebaseLogin
);
// مسار تسجيل مستخدم
router.post(
  "/register",
  validateRegister,
  handleValidationErrors,
  authController.register
);

// ✅ مسار التحقق من صلاحية التوكن
router.get("/verify-token", authController.verifyToken);

// مسار طلب استعادة كلمة المرور
router.post("/forgot-password", authController.forgotPassword);

// مسار التحقق من رمز OTP المرسل لاستعادة كلمة المرور
router.post("/verify-otp", authController.verifyPasswordResetOtp);

// مسار إعادة تعيين كلمة المرور بعد التحقق من الرمز
router.post(
  "/reset-password",
  validatePassword,
  handleValidationErrors,
  authController.resetPassword
);
//////
// routes/auth.js
router.post('/create-custom-token', async (req, res) => {
  try {
    const { uid } = req.body;

    if (!uid) {
      return res.status(400).json({ error: 'UID is required' });
    }

    const customToken = await admin.auth().createCustomToken(uid);
    res.json({ customToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
