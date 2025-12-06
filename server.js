/*
ملف السيرفر الرئيسي (server.js)
------------------------------
- نقطة البداية لتشغيل تطبيق الـ backend باستخدام Express.js.
- يهيئ الإعدادات العامة (middlewares)، يربط قاعدة البيانات (MySQL)، ويعرّف المسارات (routes).
- اللوجيك: استقبال الطلبات، تمريرها للمسارات المناسبة، التعامل مع الأخطاء، وتسجيل الطلبات.
*/

const express = require("express"); // استيراد إطار العمل Express لإنشاء السيرفر
const cors = require("cors"); // استيراد CORS للسماح بالوصول من دومينات مختلفة
const morgan = require("morgan"); // استيراد Morgan لتسجيل الطلبات في الكونسول
const bodyParser = require("body-parser"); // لتحليل جسم الطلبات (body) القادمة للسيرفر
const helmet = require("helmet"); // مكتبة لتعزيز أمان الهيدر
const config = require("./config"); // ملف الإعدادات الجديد
const { initializeFirebase } = require("./controllers/auth/firebaseService"); // خدمة Firebase
const app = express(); // إنشاء تطبيق Express جديد
const errorHandler = require("./middlewares/errorHandler"); // Middleware موحد للأخطاء
const authJwt = require("./middlewares/jwt");
const errorHandlerMiddleWares = require("./middlewares/errorHandlerMiddleWares");

// استيراد وظيفة الاتصال بقاعدة البيانات
const { initializeDatabase, checkDatabaseHealth, verifyTableCreation } = require("./utils/databaseInit");

// استيراد sequelize للتحقق من الاتصال بقاعدة البيانات
const sequelize = require("./models/sequelize");
 
// إعداد timeout للطلبات (30 ثانية)
app.use((req, res, next) => {
  req.setTimeout(30000);
  res.setTimeout(30000);
  next();
});

// middleware للتتبع - يطبع كل الطلبات
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});
 app.use(cors({
  origin: [
   
    "https://application.visitsyria.fun", 
      "http://localhost:3606",
      "http://localhost:3000",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "x-access-token"]
}));

// دعم طلبات OPTIONS (preflight)
app.options("*", cors());

// تمكين Morgan بأسلوب المطور لعرض الطلبات بشكل مختصر وملون
// يعرض معلومات الطلب مثل النوع ورمز الحالة بألوان يسهل قراءتها
app.use(morgan("dev"));

// تمكين body-parser لتحويل نصوص الطلبات إلى JSON تلقائيًا
// يحول البيانات المرسلة في النص إلى كائن JavaScript
app.use(bodyParser.json());

// تمكين body-parser للبيانات المشفرة
// يدعم تحليل البيانات المشفرة في النماذج
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // السماح بعرض الصور/الفيديو عبر أصول مختلفة
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // السماح بالسكريبتات المضمنة لصفحات الاختبار
        styleSrc: ["'self'", "'unsafe-inline'"], // السماح بالأنماط المضمنة
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
      },
    },
  })
); // تفعيل helmet وتعريف سياسة CORP المناسبة للوسائط
app.options("*", cors()); // تفعيل CORS لطلبات OPTIONS (مهم لطلبات PUT/DELETE)

// إعداد خدمة الملفات الثابتة قبل JWT middleware
// خدمة ملفات HTML من مجلد views
app.use("/views", express.static(__dirname + "/views"));
app.use("/public", express.static(__dirname + "/public"));

// Route مخصص للصور مع headers مناسبة للـ crawlers
app.use(
  "/uploads",
  (req, res, next) => {
    // Add headers for social media crawlers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    next();
  },
  express.static(__dirname + "/public/uploads")
);

// استيراد الـ middlewares

//admin routes
// ربط المسارات (routes)

const authRouter = require("./routes/auth"); // استيراد مسارات التوثيق (auth)
const usersRouter = require("./routes/users"); // استيراد مسارات التوثيق (users)
const userInterestsRouter = require("./routes/users/userInterests"); // استيراد مسارات اهتمامات المستخدمين
const postsRouter = require("./routes/users/posts");
const storiesRouter = require("./routes/users/stories");
const tagsRouter = require("./routes/users/tags");
const servicesRouter = require("./routes/users/service");
const emergencyServicesRouter = require("./routes/users/emergencyServices"); // استيراد مسارات خدمات الطوارئ
const likesRouter = require("./routes/users/likes");
const savesRouter = require("./routes/users/saves");
const favoritesRouter = require("./routes/users/favorites");
const tripsRouter = require("./routes/users/trips"); // استيراد مسارات الرحلات
const tourGuidesRouter = require("./routes/users/tourGuides"); // استيراد مسارات المرشدين السياحيين
const experiencesRouter = require("./routes/users/experiences"); // استيراد مسارات التجارب
const adminRouter = require("./routes/admin"); // استيراد مسارات الإدارة
const newEventsRouter = require("./routes/users/NewEvents"); // استيراد مسارات الأحداث الجديدة
const exploreRouter = require("./routes/users/explore"); // استيراد مسارات Explore
const publicTransportRouter = require("./routes/users/publicTransport"); // استيراد مسارات وسائل المواصلات العامة
const ownerContactRouter = require("./routes/users/ownerContact"); // استيراد مسارات معلومات تواصل المالك
const feedbackRouter = require("./routes/users/feedback"); // استيراد مسارات ملاحظات المستخدمين
const visaTypesRouter = require("./routes/users/visaTypes"); // استيراد مسارات أنواع التأشيرات
const eVisaRouter = require("./routes/eVisa"); // استيراد مسارات الطلبات الإلكترونية للتأشيرات
const foodAndDrinksRouter = require("./routes/users/FoodAndDrinks"); // استيراد مسارات الطعام والشراب
const artsCultureRouter = require("./routes/users/artsCulture"); // استيراد مسارات الفنون والثقافة
const offersRouter = require("./routes/users/offers"); // استيراد مسارات العروض
const { startStoryCleanupJobs } = require("./jobs/storyCleanup"); // استيراد وظيفة التنظيف

// تسجيل مسار التوثيق أولاً قبل تطبيق JWT middleware
// هذا يضمن أن مسارات التحديث والتحقق من التوكن غير محمية
app.use(`${config.API}/`, authRouter); // ربط مسارات التوثيق بالمسار الأساسي للـ API-auth

// تطبيق middleware الـ JWT على طلبات API فقط (بعد تسجيل مسارات التوثيق)
app.use(authJwt());

// تطبيق معالج أخطاء JWT (تجديد الـ tokens)
app.use(errorHandlerMiddleWares);

// ربط باقي المسارات (التي تحتاج إلى توثيق)
app.use(`${config.API}/users`, usersRouter); // ربط مسارات التوثيق بالمسار الأساسي للـ API-users
app.use(`${config.API}/users`, userInterestsRouter); // ربط مسارات اهتمامات المستخدمين
app.use(`${config.API}/posts`, postsRouter);
app.use(`${config.API}/stories`, storiesRouter);
app.use(`${config.API}/tags`, tagsRouter);
app.use(`${config.API}/services`, servicesRouter);
app.use(`${config.API}/emergency-services`, emergencyServicesRouter); // ربط مسارات خدمات الطوارئ
app.use(`${config.API}/likes`, likesRouter);
app.use(`${config.API}/saves`, savesRouter);
app.use(`${config.API}/favorites`, favoritesRouter);
app.use(`${config.API}/trips`, tripsRouter); // ربط مسارات الرحلات
app.use(`${config.API}/tour-guides`, tourGuidesRouter); // ربط مسارات المرشدين السياحيين
app.use(`${config.API}/experiences`, experiencesRouter); // ربط مسارات التجارب
app.use(`${config.API}/admin`, adminRouter); // ربط مسارات الإدارة
app.use(`${config.API}/new-events`, newEventsRouter); // ربط مسارات الأحداث الجديدة
app.use(`${config.API}/explore`, exploreRouter); // ربط مسارات Explore
app.use(`${config.API}/public-transport`, publicTransportRouter); // ربط مسارات وسائل المواصلات العامة
app.use(`${config.API}/owner-contact`, ownerContactRouter); // ربط مسارات معلومات تواصل المالك
app.use(`${config.API}/feedback`, feedbackRouter); // ربط مسارات ملاحظات المستخدمين
app.use(`${config.API}/visa-types`, visaTypesRouter); // ربط مسارات أنواع التأشيرات
app.use(`${config.API}/e-visa`, eVisaRouter); // ربط مسارات الطلبات الإلكترونية للتأشيرات
app.use(`${config.API}/food-drinks`, foodAndDrinksRouter); // ربط مسارات الطعام والشراب
app.use(`${config.API}/arts-culture`, artsCultureRouter); // ربط مسارات الفنون والثقافة
app.use(`${config.API}/offers`, offersRouter); // ربط مسارات العروض
// --------------------------------------------

app.get("/", (req, res) => {
  // إرجاع رسالة نجاح عند الاتصال بالسيرفر
  return res
    .status(200)
    .json({ status: "success", message: "Connected successfully!" });
});

// Middleware لمعالجة الأخطاء بشكل موحد (يجب أن يكون في النهاية)
app.use(errorHandler);

// تهيئة Firebase (مستقل عن قاعدة البيانات)
try {
  initializeFirebase();
  console.log("Firebase initialized successfully!");
} catch (firebaseError) {
  console.warn("Firebase initialization failed:", firebaseError.message);
  console.warn("Firebase authentication will not be available.");
}

// الاتصال بقاعدة بيانات MySQL
console.log("Attempting to connect to MySQL...");
async function connectToDatabase() {
  try {
    // محاولة الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('Database connection test successful');
    
   
    
    // تهيئة قاعدة البيانات بنظام محكوم (كنسخة احتياطية)
    await initializeDatabase();
    
    // التحقق من أن الجداول تم إنشاؤها فعلاً
    await verifyTableCreation();
    
    // التحقق من صحة قاعدة البيانات
    const isHealthy = await checkDatabaseHealth();
    if (isHealthy) {
      console.log("Database is healthy and ready");
    } else {
      console.warn("Database may have issues, but continuing...");
    }
    
    // بدء مهام التنظيف
    startStoryCleanupJobs(__dirname); 
  } catch (error) {
    console.error("Connected to DB error! :", error.message);
    console.log("Server will continue running without database connection.");
    // Continue running the server even if DB connection fails
  }
}

// استدعاء وظيفة الاتصال بقاعدة البيانات
connectToDatabase();

// بدء الاستماع للطلبات على المنفذ والمضيف المحددين
app.listen(config.PORT, config.HOST, () => {
  console.log(`Server is running at http://${config.HOST}:${config.PORT}`);
});

//https://visitsyria.fun/api/v1
