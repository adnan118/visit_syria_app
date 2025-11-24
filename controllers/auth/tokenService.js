const jwt = require("jsonwebtoken");
const Token = require("../../models/tokenModel");
const config = require("../../config");

/**
 * تنشئ accessToken مع الحقول المطلوبة
 * @param {Object} user - كائن المستخدم (User model أو Object يحتوي الحقول)
 * @param {Object} extraClaims - مطالبات إضافية اختيارية تُدمج داخل الحمولة
 */
function generateAccessToken(user, extraClaims = {}) {
  //  (payload) لتضمين الحقول المطلوبة داخل التوكن

  const payload = {
    id: user.id,
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    mobile: user.mobile,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    ...extraClaims,
  };
  // إنشاء توكن الصلاحية القصيرة (24 ساعة)
  return jwt.sign(payload, config.ACCESS_TOKEN_SECRET, { expiresIn: "24h" });
}

/**
 * تنشئ refreshToken مع نفس الحقول (أو الحد الأدنى المطلوب)
 */
function generateRefreshToken(user, extraClaims = {}) {
  // بناء الحمولة لتخزين معلومات يمكن استخدامها عند التحقق لاحقًا
  const payload = {
    id: user.id,
    userId: user.id,
    firstName: user.firstName,
    email: user.email,
    mobile: user.mobile,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
    ...extraClaims,
  };
  // إنشاء توكن التجديد (60 يومًا)
  return jwt.sign(payload, config.REFRESH_TOKEN_SECRET, { expiresIn: "60d" });
}

/**
 * تحفظ التوكن في قاعدة البيانات مع الحقول الإضافية.
 * تتأكد من حذف أي توكن سابق لنفس المستخدم لتجنب تعدد السجلات.
 * @param {ObjectId} userId - معرف المستخدم في قاعدة البيانات
 * @param {String} accessToken - توكن الدخول
 * @param {String} refreshToken - توكن التجديد
 * @param {Object} user - (اختياري) كائن المستخدم لحفظ الحقول الإضافية في سجل التوكن
 */
async function saveToken(userId, accessToken, refreshToken, user = {}) {
  // حذف توكن قديم إن وجد
  const token = await Token.findOne({ where: { userId } });
  if (token) await token.destroy(); // حذف التوكن القديم إن وجد

  // بناء المستند مع الحقول المطلوبة
  const tokenDoc = await Token.create({
    userId,
    accessToken,
    refreshToken,
    firstName: user.firstName,
    email: user.email,
    mobile: user.mobile,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  });

  return tokenDoc;
}

/**
 * التحقق من وجود التوكن وصلاحيته داخل قاعدة البيانات.
 * يعيد false إذا لم يوجد أو إذا كان التحقق قد فشل.
 * @param {String} accessToken - توكن الدخول الذي نريد التحقق منه في DB
 */
async function verifyTokenInDb(accessToken) {
  // البحث عن المستند الذي يحتوي على accessToken
  const token = await Token.findOne({ where: { accessToken } });
  if (!token) return false;
  try {
    // فك التشفير المؤقت لقراءة بيانات refreshToken
    const tokenData = jwt.decode(token.refreshToken);
    // التحقق من صلاحية refreshToken باستخدام السر في الإعدادات
    const isValid = jwt.verify(token.refreshToken, config.REFRESH_TOKEN_SECRET);
    // إذا كان صالحًا أرجع بيانات التوكن، وإلا أعد false
    return isValid && tokenData;
  } catch {
    return false;
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  saveToken,
  verifyTokenInDb,
};