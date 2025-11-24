/*
خدمة Firebase للمصادقة (firebaseService.js)
---------------------------------------------
- يحتوي على دوال التحقق من توكنات Firebase للمصادقة عبر Google و Facebook
- يتطلب إعداد Firebase Admin SDK
*/

const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");
const jwksClient = require("jwks-rsa");

// تهيئة Firebase Admin SDK
let firebaseApp;

/**
 * تهيئة Firebase Admin SDK
 * يجب استدعاؤها مرة واحدة عند بدء التطبيق
 */
function initializeFirebase() {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      return firebaseApp;
    }

    // Check if default app already exists
    if (admin.apps && admin.apps.length > 0) {
      firebaseApp = admin.app();
      console.log("Using existing Firebase app");
      return firebaseApp;
    }

    console.log("Initializing Firebase with environment variables...");

    // استخدام متغيرات البيئة للتهيئة
    const serviceAccount = {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: "https://accounts.google.com/o/oauth2/auth",
      token_uri: "https://oauth2.googleapis.com/token",
      auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(
        process.env.FIREBASE_CLIENT_EMAIL
      )}`,
    };

    if (!serviceAccount.project_id) {
      throw new Error(
        "Firebase configuration missing. Please provide environment variables."
      );
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
    console.log(
      "Firebase Admin SDK initialized successfully with environment variables"
    );
    return firebaseApp;
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
    throw error;
  }
}

/**
 * التحقق من صحة Firebase ID Token
 * @param {string} idToken - Firebase ID Token
 * @returns {Promise<object>} - معلومات المستخدم من Firebase
 */
async function verifyFirebaseToken(idToken) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    // First, try to verify as an ID token using Firebase Admin SDK
    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);

      // استخراج معلومات المستخدم
      const userInfo = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        name: decodedToken.name,
        picture: decodedToken.picture,
        provider: decodedToken.firebase.sign_in_provider, // 'google.com' أو 'facebook.com'
      };

      // استخراج معلومات إضافية حسب المزود
      if (decodedToken.firebase.sign_in_provider === "google.com") {
        userInfo.googleId = decodedToken.uid;
        userInfo.firstName = decodedToken.given_name || "";
        userInfo.lastName = decodedToken.family_name || "";
      } else if (decodedToken.firebase.sign_in_provider === "facebook.com") {
        userInfo.facebookId = decodedToken.uid;
        // Facebook قد لا يوفر given_name و family_name في التوكن
        const nameParts = (decodedToken.name || "").split(" ");
        userInfo.firstName = nameParts[0] || "";
        userInfo.lastName = nameParts.slice(1).join(" ") || "";
      }

      return userInfo;
    } catch (idTokenError) {
      console.error("ID token verification failed:", idTokenError.message);
      // Log additional details about the error
      if (idTokenError.code) {
        console.error("Error code:", idTokenError.code);
      }
      if (idTokenError.stack) {
        console.error("Error stack:", idTokenError.stack);
      }

      // التحقق مما إذا كان الخطأ متعلقًا بالشبكة أو بالوصول
      if (
        idTokenError.message &&
        (idTokenError.message.includes("fetching public keys") ||
          idTokenError.message.includes("403"))
      ) {
        // في حالة فشل الحصول على المفاتيح، نحاول التحقق بشكل بديل
        console.warn(
          "Network issue detected. Attempting alternative verification method."
        );
        return await verifyFirebaseTokenLocally(idToken);
      }

      // If ID token verification fails, re-throw the error instead of trying custom token verification
      throw new Error("Invalid Firebase ID token: " + idTokenError.message);
    }
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    // Log additional details about the error
    if (error.code) {
      console.error("Error code:", error.code);
    }
    if (error.stack) {
      console.error("Error stack:", error.stack);
    }

    throw new Error("Invalid Firebase token: " + error.message);
  }
}

/**
 * التحقق من صحة Firebase ID Token محليًا (بديل عند وجود مشاكل في الشبكة)
 * @param {string} idToken - Firebase ID Token
 * @returns {Promise<object>} - معلومات المستخدم من Firebase
 */
async function verifyFirebaseTokenLocally(idToken) {
  try {
    // فك تشفير التوكن دون التحقق من التوقيع (لأغراض التطوير فقط)
    const decoded = jwt.decode(idToken, { complete: true });

    if (!decoded || !decoded.payload) {
      throw new Error("Invalid token format");
    }

    const payload = decoded.payload;

    // التحقق من صلاحية التوكن
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error("Token has expired");
    }

    if (payload.iat > now) {
      throw new Error("Token issued at future time");
    }

    // التحقق من صاحب العمل (audience)
    if (payload.aud !== "visit-syria-c5bcf") {
      throw new Error("Invalid audience");
    }

    // التحقق من المصدر (issuer)
    if (payload.iss !== "https://securetoken.google.com/visit-syria-c5bcf") {
      throw new Error("Invalid issuer");
    }

    // استخراج معلومات المستخدم
    const userInfo = {
      uid: payload.user_id || payload.sub,
      email: payload.email,
      emailVerified: payload.email_verified || false,
      name: payload.name,
      picture: payload.picture,
      provider: payload.firebase?.sign_in_provider || "firebase",
    };

    // استخراج معلومات إضافية حسب المزود
    if (payload.firebase?.sign_in_provider === "google.com") {
      userInfo.googleId = payload.user_id || payload.sub;
      userInfo.firstName = payload.given_name || "";
      userInfo.lastName = payload.family_name || "";
    } else if (payload.firebase?.sign_in_provider === "facebook.com") {
      userInfo.facebookId = payload.user_id || payload.sub;
      // Facebook قد لا يوفر given_name و family_name في التوكن
      const nameParts = (payload.name || "").split(" ");
      userInfo.firstName = nameParts[0] || "";
      userInfo.lastName = nameParts.slice(1).join(" ") || "";
    }

    console.warn(
      "Token verified locally without signature validation. This should only be used in development environments."
    );
    return userInfo;
  } catch (error) {
    console.error("Local token verification failed:", error.message);
    throw new Error(
      "Unable to verify token due to network restrictions and local verification failed: " +
        error.message
    );
  }
}

/**
 * التحقق من Custom Token (للاختبار فقط - غير آمن)
 * @param {string} customToken - Firebase Custom Token
 * @returns {Promise<object>} - معلومات المستخدم من Firebase
 */
async function verifyCustomToken(customToken) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    // فك تشفير التوكن دون التحقق من التوقيع (للاختبار فقط)
    const jwt = require("jsonwebtoken");
    const decoded = jwt.decode(customToken);

    if (!decoded || !decoded.uid) {
      throw new Error("Invalid custom token");
    }

    // الحصول على معلومات المستخدم من Firebase باستخدام UID
    const userRecord = await getFirebaseUser(decoded.uid);

    const userInfo = {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      name: userRecord.displayName,
      picture: userRecord.photoURL,
      provider: "firebase", // افتراضياً
    };

    // محاولة استخراج firstName و lastName من displayName
    if (userRecord.displayName) {
      const nameParts = userRecord.displayName.split(" ");
      userInfo.firstName = nameParts[0] || "";
      userInfo.lastName = nameParts.slice(1).join(" ") || "";
    } else {
      userInfo.firstName = "User";
      userInfo.lastName = "Account";
    }

    return userInfo;
  } catch (error) {
    console.error("Custom token verification failed:", error);
    throw new Error("Invalid custom token");
  }
}

/**
 * الحصول على معلومات مستخدم من Firebase
 * @param {string} uid - Firebase UID
 * @returns {Promise<object>} - معلومات المستخدم
 */
async function getFirebaseUser(uid) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const userRecord = await admin.auth().getUser(uid);
    return {
      uid: userRecord.uid,
      email: userRecord.email,
      emailVerified: userRecord.emailVerified,
      displayName: userRecord.displayName,
      photoURL: userRecord.photoURL,
      disabled: userRecord.disabled,
      providerData: userRecord.providerData,
    };
  } catch (error) {
    console.error("Failed to get Firebase user:", error);
    throw error;
  }
}

/**
 * إنشاء custom token لمستخدم
 * @param {string} uid - Firebase UID
 * @param {object} additionalClaims - claims إضافية
 * @returns {Promise<string>} - Custom token
 */
async function createCustomToken(uid, additionalClaims = {}) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    return await admin.auth().createCustomToken(uid, additionalClaims);
  } catch (error) {
    console.error("Failed to create custom token:", error);
    throw error;
  }
}

module.exports = {
  initializeFirebase,
  verifyFirebaseToken,
  verifyCustomToken,
  getFirebaseUser,
  createCustomToken,
};
