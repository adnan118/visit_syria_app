/*
ملف كنترولر التوثيق (auth.js)
-----------------------------
- يحتوي على جميع دوال التوثيق: تسجيل، تسجيل دخول، تسجيل عبر Google/Facebook،
  التحقق من التوكن، واستعادة كلمة المرور.
*/

const User = require("../../models/userModel");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const tokenService = require("./tokenService");
const firebaseService = require("./firebaseService");
const mailSender = require("../../controllers/services/emailService");
const smsSender = require("../../controllers/services/smsService");
const {
  handleUploadError,
  deleteMultipleFiles,
  downloadImageFromUrlToUploads,
} = require("../../controllers/services/mediaHelper");

/* =========================================================
   📌 Register (Local)
========================================================= */
exports.register = async function (req, res, next) {
  try {
    const { password, provider = "local", firstName, lastName, bio, email, mobile } = req.body;

    // لو التسجيل عبر local فقط → نشفّر كلمة المرور
    const passwordHash =
      provider === "local" ? bcrypt.hashSync(password, 8) : undefined;

    // username مبدئياً: firstName + lastName (مع lowercase & بدون فراغات)
    const username = `${firstName}${lastName}`
      .toLowerCase()
      .replace(/\s+/g, "");

    // صورة افتراضية (موجودة عندك في مجلد users) — نحفظ فقط اسم الملف في DB
    const defaultProfileImage = "default-user.png";

    // التحقق من وجود مستخدم بنفس البريد الإلكتروني
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      const error = new Error("User with that email already exists.");
      error.status = 409;
      throw error;
    }

    // إنشاء كائن المستخدم بدون نشر req.body بالكامل لتجنب تجاوز passwordHash
    const userData = {
      firstName,
      lastName,
      username,
      email,
      mobile,
      passwordHash,
      image: defaultProfileImage,
      bio,
      provider
    };

    let user = await User.create(userData);

    /*
    // OTP للتفعيل
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // إرسال OTP على الإيميل
    await mailSender.sendEmail(
      email,
      otp,
      "Account Verification Code",
      `${user.firstName} ${user.lastName}`
    );*/
    
    // Remove sensitive data
    const userObj = user.get({ plain: true });
    delete userObj.passwordHash;
    delete userObj.resetPasswordOtp;
    delete userObj.resetPasswordOtpExpires;

    // Generate tokens and save
    const accessToken = tokenService.generateAccessToken(userObj);
    const refreshToken = tokenService.generateRefreshToken(userObj);
    await tokenService.saveToken(userObj.id, accessToken, refreshToken, userObj);

    return res.status(201).json({
      status: "success",
      message: "User created successfully.",
      data: { ...userObj, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Login (Local)
========================================================= */
exports.login = async function (req, res, next) {
  try {
    const { email, mobile, password } = req.body;

    // السماح بالدخول بالبريد أو الهاتف
    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (mobile) {
      user = await User.findOne({ where: { mobile } });
    }

    if (!user) {
      const error = new Error("User not found, check your credentials.");
      error.status = 404;
      throw error;
    }
    
    if (!user.isActive) {
      const error = new Error(
        "User not active. Please verify your account first."
      );
      error.status = 403;
      throw error;
    }

    // تحقق كلمة المرور لو provider = local
    if (user.provider === "local") {
      if (!bcrypt.compareSync(password, user.passwordHash)) {
        const error = new Error("Incorrect password!");
        error.status = 400;
        throw error;
      }
    }

    // Refresh user data from database to ensure we have the latest information
    // This fixes issues where token data might be outdated (e.g., isAdmin changes)
    user = await User.findByPk(user.id);

    // إنشاء التوكنات
    const userObj = user.get({ plain: true });
    delete userObj.passwordHash;
    
    const accessToken = tokenService.generateAccessToken(userObj);
    const refreshToken = tokenService.generateRefreshToken(userObj);
    await tokenService.saveToken(userObj.id, accessToken, refreshToken);

    // إرسال تنبيه تسجيل الدخول
    await mailSender.sendEmailNewLogin(
      user.email,
      "Login",
      `${user.firstName} ${user.lastName}`
    );

    return res.json({
      status: "success",
      message: "Login successful",
      data: { ...userObj, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Social Login (Google/Facebook)
========================================================= */
exports.socialLogin = async function (req, res, next) {
  try {
    const raw = req.body || {};

    let provider = raw.provider;
    // سيتم التحقق من قيمة provider بعد استخراج التوكن ومحاولة الاستدلال عليه

    // التحقق من التوكن وجلب بيانات البروفايل من المزود مباشرة
    let token = raw.token;
    if (
      !token &&
      req.headers &&
      typeof req.headers.authorization === "string"
    ) {
      const m = req.headers.authorization.match(/^Bearer\s+(.+)$/i);
      if (m) token = m[1];
    }
    if (!token) {
      const error = new Error("Token is required");
      error.status = 400;
      throw error;
    }

    // استنتاج المزود من تلميحات التوكن عندما لا يرسل في الجسم
    if (!provider) {
      // Google access_token عادة لا يكون JWT (لا يحتوي على نقاط ثلاثية)
      const isLikelyJwt =
        typeof token === "string" && token.split(".").length === 3;
      provider = isLikelyJwt ? "google" : "google"; // حالياً ندعم جوجل وفيسبوك، ونفترض جوجل افتراضياً
    }

    if (!["google", "facebook"].includes(provider)) {
      const error = new Error("Invalid provider");
      error.status = 400;
      throw error;
    }

    async function fetchJson(url) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          const text = await res.text();
          const err = new Error(`OAuth fetch failed: ${res.status} ${text}`);
          err.status = 401;
          throw err;
        }
        return res.json();
      } catch (networkErr) {
        // تمييز أخطاء الشبكة بوضوح
        const err = new Error(
          `Network error while contacting OAuth provider: ${networkErr.message}`
        );
        err.status = 503;
        err.cause = networkErr;
        throw err;
      }
    }

    async function getGoogleProfile(token) {
      const looksLikeJwt =
        typeof token === "string" && token.split(".").length === 3;
      if (looksLikeJwt) {
        try {
          const data = await fetchJson(
            `https://oauth2.googleapis.com/tokeninfo?id_token=${token}`
          );
          if (
            process.env.GOOGLE_CLIENT_ID &&
            data.aud &&
            data.aud !== process.env.GOOGLE_CLIENT_ID
          ) {
            const err = new Error("Invalid Google token audience");
            err.status = 401;
            throw err;
          }
          return {
            id: data.sub,
            email: data.email,
            name: data.name,
            firstName: data.given_name,
            lastName: data.family_name,
            picture: data.picture,
          };
        } catch (e) {}
      }
      // treat as access_token (e.g., from Google OAuth Playground)
      const endpoints = [
        "https://www.googleapis.com/oauth2/v3/userinfo",
        "https://www.googleapis.com/oauth2/v2/userinfo",
        "https://openidconnect.googleapis.com/v1/userinfo",
      ];
      let u;
      let lastErr;
      for (const url of endpoints) {
        try {
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!res.ok) {
            const text = await res.text();
            throw new Error(`OAuth fetch failed: ${res.status} ${text}`);
          }
          u = await res.json();
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      // إذا فشلت userinfo بكل المحاولات، جرّب فحص access_token عبر tokeninfo لمعرفة السكوبات
      if (!u) {
        try {
          const info = await fetchJson(
            `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`
          );
          // نتوقع وجود scope يحتوي email, profile
          const scopeStr = info.scope || "";
          const scopes = scopeStr.split(/\s+/).filter(Boolean);
          const hasEmail = scopes.includes(
            "https://www.googleapis.com/auth/userinfo.email"
          );
          const hasProfile = scopes.includes(
            "https://www.googleapis.com/auth/userinfo.profile"
          );
          if (!hasEmail || !hasProfile) {
            const err = new Error(
              "Google access_token missing required scopes (userinfo.email, userinfo.profile). Regenerate token with openid, email, profile."
            );
            err.status = 401;
            throw err;
          }
          // إن كانت السكوبات موجودة ومع ذلك فشل userinfo، نرجّح انتهاء صلاحية أو عدم صلاحية التوكن
          const err = new Error(
            "Invalid or expired Google access_token. Please regenerate via OAuth Playground with correct scopes."
          );
          err.status = 401;
          throw err;
        } catch (infoErr) {
          // إذا tokeninfo نفسه فشل، أعِد الخطأ الأخير من userinfo إن وجد، أو infoErr
          throw lastErr || infoErr;
        }
      }

      return {
        id: u.sub || u.id,
        email: u.email,
        name: u.name,
        firstName: u.given_name || u.first_name,
        lastName: u.family_name || u.last_name,
        picture: u.picture?.data?.url || u.picture,
      };
    }

    async function getFacebookProfile(accessToken) {
      const fields = "id,first_name,last_name,name,email,picture.type(large)";
      const data = await fetchJson(
        `https://graph.facebook.com/me?fields=${fields}&access_token=${accessToken}`
      );
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        firstName: data.first_name,
        lastName: data.last_name,
        picture: data.picture?.data?.url,
      };
    }

    let oauth;
    try {
      oauth =
        provider === "google"
          ? await getGoogleProfile(token)
          : await getFacebookProfile(token);
    } catch (e) {
      // وضع تطوير اختياري يسمح بالتجاوز عند أي خطأ OAuth أثناء التطوير
      if (process.env.OAUTH_DEV_BYPASS === "true") {
        const nowId = `dev_${Date.now()}`;
        oauth = {
          id: raw.googleId || raw.facebookId || raw.sub || raw.id || nowId,
          email: raw.email,
          name: raw.name,
          firstName: raw.firstName || raw.given_name || raw.first_name,
          lastName: raw.lastName || raw.family_name || raw.last_name,
          picture: raw.picture || raw.image,
        };
      } else {
        throw e;
      }
    }

    // استخراج الحقول من ناتج OAuth أولاً ثم من الجسم كبدائل
    let email = oauth.email || raw.email || raw.emails?.[0]?.value || "";
    let firstName =
      oauth.firstName ||
      raw.firstName ||
      raw.given_name ||
      raw.first_name ||
      "";
    let lastName =
      oauth.lastName || raw.lastName || raw.family_name || raw.last_name || "";
    const fullName = oauth.name || raw.name || raw.displayName || "";
    const picture =
      oauth.picture || raw.image || raw.picture?.data?.url || raw.picture || "";

    // وظيفة موحدة لتحميل صورة البروفايل من URL إلى مجلد users مع الضغط
    async function downloadImageToUsersFolder(imageUrl) {
      return downloadImageFromUrlToUploads(imageUrl, {
        contentType: "users",
        subfolder: "images",
        fileNamePrefix: "user_",
        compress: true,
      });
    }

    // إذا ما توفر first/last وحضر الاسم الكامل → نفككه
    if ((!firstName || !lastName) && fullName) {
      const parts = fullName.trim().split(/\s+/);
      firstName = firstName || parts[0] || "";
      lastName = lastName || parts.slice(1).join(" ") || "";
    }

    // fallback من الإيميل
    if (!firstName && email) firstName = email.split("@")[0];
    if (!lastName) lastName = lastName || "-";

    // معرفات مزود الخدمة (نفضّل ID القادم من OAuth)
    const googleId =
      provider === "google"
        ? oauth.id || raw.googleId || raw.sub || raw.id
        : undefined;
    const facebookId =
      provider === "facebook"
        ? oauth.id || raw.facebookId || raw.id
        : undefined;

    // ضمان وجود بريد صالح؛ إذا لم يأتِ من المزود، ننشئ بريداً شكلياً صالحاً وموحداً
    const emailRegex =
      /^(?:(?:[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+\/=?^_`{|}~-]+)*)|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}|[a-zA-Z0-9-]{1,63}\.[a-zA-Z]{2,})$/;
    if (!email || !emailRegex.test(email)) {
      const toSlug = (s) =>
        String(s || "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9._-]/g, "");
      const base = toSlug(googleId || facebookId || raw.username || "user");
      email = `${base}@social.visitsyria.fun`;
    }

    // التحقق من وجود مستخدم بنفس معرف OAuth
    let user;
    if (provider === "google" && googleId) {
      user = await User.findOne({ where: { googleId } });
    } else if (provider === "facebook" && facebookId) {
      user = await User.findOne({ where: { facebookId } });
    }

    // إذا لم يوجد مستخدم بنفس معرف OAuth، نبحث بالبريد الإلكتروني
    if (!user && email) {
      user = await User.findOne({ where: { email } });
    }

    let imageFilename = "default-user.png";
    // إذا كان هناك صورة من OAuth، نحملها
    if (picture) {
      try {
        imageFilename = await downloadImageToUsersFolder(picture);
      } catch (imgErr) {
        console.warn("Failed to download social profile image:", imgErr.message);
        // نستمر مع الصورة الافتراضية
      }
    }

    // إذا لم يوجد مستخدم، ننشئ حساباً جديداً
    if (!user) {
      const username = `${firstName}${lastName}`
        .toLowerCase()
        .replace(/\s+/g, "");

      user = await User.create({
        firstName,
        lastName,
        email,
        username,
        provider,
        googleId,
        facebookId,
        image: imageFilename,
        emailVerified: true, // نعتبر البريد مُحقق عند تسجيل الدخول عبر OAuth
      });
    } else {
      // تحديث معلومات المستخدم الموجودة
      const updateData = {
        firstName,
        lastName,
        email,
        provider,
        image: imageFilename,
        emailVerified: true,
      };

      if (provider === "google" && googleId) {
        updateData.googleId = googleId;
      } else if (provider === "facebook" && facebookId) {
        updateData.facebookId = facebookId;
      }

      await user.update(updateData);
    }

    // Refresh user data from database to ensure we have the latest information
    user = await User.findByPk(user.id);
    
    // إنشاء التوكنات
    const userObj = user.get({ plain: true });
    delete userObj.passwordHash;
    
    const accessToken = tokenService.generateAccessToken(userObj);
    const refreshToken = tokenService.generateRefreshToken(userObj);
    await tokenService.saveToken(userObj.id, accessToken, refreshToken);

    // إرسال تنبيه تسجيل الدخول
    await mailSender.sendEmailNewLogin(
      user.email,
      "Social Login",
      `${user.firstName} ${user.lastName}`
    );

    return res.json({
      status: "success",
      message: "Social login successful",
      data: { ...userObj, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Firebase Login (Google/Facebook)
========================================================= */
exports.firebaseLogin = async function (req, res, next) {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      const error = new Error("Firebase ID token is required");
      error.status = 400;
      throw error;
    }

    // التحقق من Firebase token
    let firebaseUser;
    try {
      firebaseUser = await firebaseService.verifyFirebaseToken(idToken);
    } catch (error) {
      const authError = new Error(error.message || "Invalid Firebase token");
      authError.status = error.message.includes("network") ? 503 : 401;
      throw authError;
    }

    // تحديد نوع المزود
    let provider = "firebase";
    if (firebaseUser.provider === "google.com") {
      provider = "google";
    } else if (firebaseUser.provider === "facebook.com") {
      provider = "facebook";
    }

    // البحث عن المستخدم في قاعدة البيانات
    const searchCriteria = [];

    if (firebaseUser.email) {
      searchCriteria.push({ email: firebaseUser.email });
    }

    if (provider === "google" && firebaseUser.googleId) {
      searchCriteria.push({ googleId: firebaseUser.googleId });
    }

    if (provider === "facebook" && firebaseUser.facebookId) {
      searchCriteria.push({ facebookId: firebaseUser.facebookId });
    }

    let user =
      searchCriteria.length > 0
        ? await User.findOne({ $or: searchCriteria })
        : null;

    // تنزيل صورة البروفايل إذا كانت متوفرة
    async function downloadFirebaseProfileImage(imageUrl) {
      if (!imageUrl) return null;

      try {
        return await downloadImageFromUrlToUploads(imageUrl, {
          contentType: "users",
          subfolder: "images",
          fileNamePrefix: "firebase_user_",
          compress: true,
        });
      } catch (error) {
        console.warn("Failed to download profile image:", error);
        return null;
      }
    }

    // إنشاء username فريد
    async function generateUniqueUsername(baseUsername, excludeId = null) {
      const sanitize = (s) =>
        String(s || "")
          .toLowerCase()
          .replace(/\s+/g, "")
          .replace(/[^a-z0-9._-]/g, "");

      let candidate = sanitize(baseUsername) || "user";
      let counter = 0;

      while (
        await User.exists(
          excludeId
            ? { username: candidate, _id: { $ne: excludeId } }
            : { username: candidate }
        )
      ) {
        counter++;
        candidate = `${sanitize(baseUsername) || "user"}${counter}`;
      }

      return candidate;
    }

    const DEFAULT_IMAGE = "default-user.png";

    if (!user) {
      // إنشاء مستخدم جديد
      const firstName =
        firebaseUser.firstName ||
        (firebaseUser.email ? firebaseUser.email.split("@")[0] : "User");
      const lastName = firebaseUser.lastName || "Account";

      const baseUsername = firebaseUser.email
        ? firebaseUser.email.split("@")[0]
        : `${firstName}${lastName}`;

      const username = await generateUniqueUsername(baseUsername);

      // تنزيل صورة البروفايل
      const downloadedImage = await downloadFirebaseProfileImage(
        firebaseUser.picture
      );
      const profileImage = downloadedImage
        ? downloadedImage.split("/").pop()
        : DEFAULT_IMAGE;

      const userData = {
        provider,
        email: firebaseUser.email,
        firstName,
        lastName,
        username,
        isActive: true,
        image: profileImage,
        emailVerified: firebaseUser.emailVerified || false,
      };

      // إضافة معرفات المزود
      if (provider === "google" && firebaseUser.googleId) {
        userData.googleId = firebaseUser.googleId;
      } else if (provider === "facebook" && firebaseUser.facebookId) {
        userData.facebookId = firebaseUser.facebookId;
      }

      user = new User(userData);
      await user.save();
    } else {
      // تحديث المستخدم الموجود
      let needSave = false;

      // تحديث معرفات المزود إذا لم تكن موجودة
      if (provider === "google" && firebaseUser.googleId && !user.googleId) {
        user.googleId = firebaseUser.googleId;
        needSave = true;
      }

      if (
        provider === "facebook" &&
        firebaseUser.facebookId &&
        !user.facebookId
      ) {
        user.facebookId = firebaseUser.facebookId;
        needSave = true;
      }

      // تحديث الصورة إذا لم تكن موجودة
      if (!user.image && firebaseUser.picture) {
        const downloadedImage = await downloadFirebaseProfileImage(
          firebaseUser.picture
        );
        if (downloadedImage) {
          user.image = downloadedImage.split("/").pop();
          needSave = true;
        }
      }

      // تحديث معلومات أساسية إذا كانت ناقصة
      if (!user.firstName && firebaseUser.firstName) {
        user.firstName = firebaseUser.firstName;
        needSave = true;
      }

      if (!user.lastName && firebaseUser.lastName) {
        user.lastName = firebaseUser.lastName;
        needSave = true;
      }

      // تحديث username إذا كان غير صالح
      if (!user.username || user.username === "undefinedundefined") {
        const baseUsername = user.email
          ? user.email.split("@")[0]
          : `${user.firstName}${user.lastName}`;
        user.username = await generateUniqueUsername(baseUsername, user._id);
        needSave = true;
      }

      if (needSave) {
        await user.save();
      }
    }

    // Refresh user data from database to ensure we have the latest information
    // This fixes issues where token data might be outdated (e.g., isAdmin changes)
    user = await User.findById(user.id);

    // إنشاء التوكنات
    const accessToken = tokenService.generateAccessToken(user);
    const refreshToken = tokenService.generateRefreshToken(user);
    await tokenService.saveToken(user.id, accessToken, refreshToken);

    // إزالة معلومات حساسة
    const userObj = user.toObject();
    delete userObj.passwordHash;
    delete userObj.resetPasswordOtp;
    delete userObj.resetPasswordOtpExpires;

    // إرسال إشعار تسجيل دخول جديد
    if (user.email) {
      try {
        await mailSender.sendEmailNewLogin(
          user.email,
          `Firebase ${provider} Login`,
          `${user.firstName} ${user.lastName}`
        );
      } catch (emailError) {
        console.warn("Failed to send login notification email:", emailError);
      }
    }

    return res.json({
      status: "success",
      message: `Firebase ${provider} login successful`,
      data: { ...userObj, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Verify Token
========================================================= */
exports.verifyToken = async function (req, res, next) {
  try {
    let accessToken = req.headers["authorization"];
    if (!accessToken) return res.json(false);

    accessToken = accessToken.replace("Bearer", "").trim();
    const isValid = await tokenService.verifyTokenInDb(accessToken);

    return res.json(!!isValid);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Forgot Password
========================================================= */
/* =========================================================
   📌 Forgot Password (Email or Mobile)
========================================================= */
exports.forgotPassword = async function (req, res, next) {
  try {
    const { email, mobile } = req.body;

    if (!email && !mobile) {
      const error = new Error("Email or mobile is required.");
      error.status = 400;
      throw error;
    }

    const criteria = [];
    if (email) criteria.push({ email });
    if (mobile) criteria.push({ mobile });

    const user = await User.findOne({ $or: criteria });

    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    // تحقق أن طريقة الاتصال المقدمة تطابق بيانات المستخدم
    if (email && user.email !== email) {
      const error = new Error("Provided email does not match our records.");
      error.status = 400;
      throw error;
    }
    if (mobile && user.mobile !== mobile) {
      const error = new Error("Provided mobile does not match our records.");
      error.status = 400;
      throw error;
    }

    // إنشاء OTP
    const otp = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordOtp = otp;
    user.resetPasswordOtpExpires = Date.now() + 10 * 60 * 1000;
    await user.save();

    // إرسال OTP حسب المطابقة
    if (email && user.email === email) {
      await mailSender.sendEmail(
        user.email,
        otp,
        "Password Reset OTP",
        `${user.firstName} ${user.lastName}`
      );
    } else if (mobile && user.mobile === mobile) {
      await smsSender.sendSms(
        user.mobile,
        `Your password reset OTP is: ${otp}`
      );
    } else {
      const error = new Error(
        "No matching contact method available for this user."
      );
      error.status = 400;
      throw error;
    }

    return res.status(200).json({
      status: "success",
      message: "Password reset OTP sent successfully.",
    });
  } catch (error) {
    next(error);
  }
};
/* =========================================================
   📌 Verify OTP
========================================================= */
exports.verifyPasswordResetOtp = async function (req, res, next) {
  try {
    const { email, mobile, otp } = req.body;

    // البحث باستخدام البريد أو الموبايل
    const user = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    if (!user.resetPasswordOtp) {
      const error = new Error("No OTP requested for this user.");
      error.status = 400;
      throw error;
    }

    if (user.resetPasswordOtp !== +otp) {
      const error = new Error("Invalid OTP.");
      error.status = 401;
      throw error;
    }

    if (user.resetPasswordOtpExpires < Date.now()) {
      const error = new Error("OTP has expired.");
      error.status = 401;
      throw error;
    }

    user.resetPasswordOtp = 1; // عشان نستخدمه كعلامة إنه اتأكد
    user.isActive = true;
    user.resetPasswordOtpExpires = undefined;
    await user.save();

    return res.status(200).json({
      status: "success",
      message: "OTP confirmed successfully.",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   📌 Reset Password
========================================================= */
exports.resetPassword = async function (req, res, next) {
  try {
    const { email, mobile, newPassword } = req.body;

    if ((!email && !mobile) || !newPassword) {
      const error = new Error("Email or mobile and new password are required.");
      error.status = 400;
      throw error;
    }

    // البحث باستخدام البريد أو الموبايل
    const user = await User.findOne({
      $or: [{ email }, { mobile }],
    });

    if (!user) {
      const error = new Error("User not found.");
      error.status = 404;
      throw error;
    }

    if (user.resetPasswordOtp !== 1) {
      const error = new Error(
        "OTP not confirmed. Please verify your OTP first."
      );
      error.status = 401;
      throw error;
    }

    // تحديث كلمة المرور
    user.passwordHash = bcrypt.hashSync(newPassword, 8);
    user.resetPasswordOtp = undefined;
    user.resetPasswordOtpExpires = undefined;

    await user.save();

    return res.status(200).json({
      status: "success",
      message: "Password reset successfully.",
    });
  } catch (error) {
    next(error);
  }
};
 