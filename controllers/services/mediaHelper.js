/**
 * ملف مساعد لرفع الملفات الوسائطية (صور وفيديو)
 * Media Helper File for Uploading Media Files (Images & Videos)
 *
 * هذا الملف يحتوي على وظائف لرفع:
 * - صورة واحدة
 * - فيديو واحد
 * - صور متعددة
 * - فيديوهات متعددة
 *
 * يستخدم مكتبة multer لمعالجة رفع الملفات
 */

const multer = require("multer"); // استيراد مكتبة multer لمعالجة رفع الملفات
const path = require("path"); // استيراد وحدة path للتعامل مع مسارات الملفات
const fs = require("fs"); // استيراد وحدة fs للتعامل مع نظام الملفات
const sharp = require("sharp"); // استيراد مكتبة sharp لضغط الصور
const ffmpeg = require("fluent-ffmpeg"); // استيراد مكتبة fluent-ffmpeg لضغط الفيديو
const os = require("os"); // استيراد مكتبة os للتحقق من نظام التشغيل

// تحديد مسار FFmpeg بناءً على البيئة
function setupFFmpegPaths() {
  const platform = os.platform();

  if (platform === "win32") {
    // Windows - محلي
    const windowsFFmpegPath =
      "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe";
    const windowsFFprobePath =
      "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffprobe.exe";

    // التحقق من وجود الملفات
    const fs = require("fs");
    if (fs.existsSync(windowsFFmpegPath) && fs.existsSync(windowsFFprobePath)) {
      ffmpeg.setFfmpegPath(windowsFFmpegPath);
      ffmpeg.setFfprobePath(windowsFFprobePath);
      console.log("✅ تم تحديد مسار FFmpeg للـ Windows");
      return true;
    }
  }

  // Linux/Unix (السيرفر) - سيستخدم FFmpeg من PATH
  // لا نحتاج لتحديد مسار صريح، fluent-ffmpeg سيجد FFmpeg تلقائياً
  console.log("🔍 سيتم البحث عن FFmpeg في PATH (مناسب للسيرفر)");
  return false; // سيعتمد على PATH
}

// تطبيق إعدادات FFmpeg
const isWindowsFFmpeg = setupFFmpegPaths();
const { promisify } = require("util"); // استيراد promisify لتحويل الدوال إلى promises

/**
 * تعريف أنواع الملفات المسموح بها
 * ALLOWED_EXTENSIONS: كائن يحتوي على أنواع MIME والامتدادات المسموح بها
 */
const ALLOWED_EXTENSIONS = {
  // الصور المسموح بها
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webm",
  "image/svg+xml": "svg",

  // الفيديو المسموح به
  "video/mp4": "mp4",
  "video/avi": "avi",
  "video/mov": "mov",
  "video/wmv": "wmv",
  "video/flv": "flv",
  "video/webm": "webm",
  "video/mkv": "mkv",
};

/**
 * إعدادات ضغط الصور
 * IMAGE_COMPRESSION_SETTINGS: كائن يحتوي على إعدادات ضغط الصور
 */
const IMAGE_COMPRESSION_SETTINGS = {
  // إعدادات JPEG
  jpeg: {
    quality: 80, // جودة الصورة (0-100)
    progressive: true, // تحميل تدريجي
    mozjpeg: true, // استخدام mozjpeg للضغط الأفضل
  },
  // إعدادات PNG
  png: {
    quality: 80, // جودة الصورة (0-100)
    progressive: true, // تحميل تدريجي
    compressionLevel: 9, // مستوى الضغط (0-9)
  },
  // إعدادات WebP
  webp: {
    quality: 80, // جودة الصورة (0-100)
    lossless: false, // ضغط مع فقدان
    nearLossless: true, // ضغط شبه بدون فقدان
  },
  // إعدادات عامة
  resize: {
    maxWidth: 3840, // العرض الأقصى - 4K
    maxHeight: 2160, // الارتفاع الأقصى - 4K
    fit: "inside", // طريقة التكيف
    withoutEnlargement: true, // عدم تكبير الصور الصغيرة
  },
};

/**
 * إعدادات ضغط الفيديو
 * VIDEO_COMPRESSION_SETTINGS: كائن يحتوي على إعدادات ضغط الفيديو
 */
const VIDEO_COMPRESSION_SETTINGS = {
  // إعدادات H.264 (MP4)
  h264: {
    codec: "libx264",
    preset: "medium", // سرعة الضغط (ultrafast, superfast, veryfast, faster, fast, medium, slow, slower, veryslow)
    crf: 18, // جودة الفيديو (0-51، كلما قل الرقم كلما زادت الجودة)
    maxrate: "8M", // معدل البت الأقصى
    bufsize: "16M", // حجم البفر
  },
  // إعدادات H.265 (HEVC)
  h265: {
    codec: "libx265",
    preset: "medium",
    crf: 23, // جودة أعلى لـ H.265
    maxrate: "6M",
    bufsize: "12M",
  },
  // إعدادات WebM (VP9)
  webm: {
    codec: "libvpx-vp9",
    crf: 25, // تحسين جودة VP9
    maxrate: "4M",
    bufsize: "8M",
  },
  // إعدادات عامة
  audio: {
    codec: "aac", // كودك الصوت
    bitrate: "320k", // معدل البت للصوت - جودة أعلى
  },
  // إعدادات الحجم
  resize: {
    maxWidth: 1920,
    maxHeight: 1080,
    maintainAspectRatio: true,
  },
};

/**
 * دالة لإنشاء مجلد إذا لم يكن موجوداً
 * @param {string} folderPath - مسار المجلد المراد إنشاؤه
 */
const createFolderIfNotExists = (folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 تم إنشاء المجلد: ${folderPath}`);
    } else {
      console.log(`📁 المجلد موجود بالفعل: ${folderPath}`);
    }
  } catch (error) {
    console.error(`❌ خطأ في إنشاء المجلد ${folderPath}:`, error);
    throw error;
  }
};

/**
 * دالة لتحديد مجلد الرفع حسب نوع المحتوى
 * @param {string} contentType - نوع المحتوى (categories, products, users, etc.)
 * @param {string} fileType - نوع الملف (images, videos)
 * @returns {string} - مسار المجلد
 */
const getUploadPath = (contentType, fileType) => {
  return `public/uploads/${fileType}/${contentType}/`;
};

/**
 * دالة لتنظيف اسم الملف من الأحرف غير المرغوب فيها
 * @param {string} filename - اسم الملف الأصلي
 * @returns {string} - اسم الملف المنظف
 */
const sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, "-") // استبدال الأحرف الخاصة بشرطة
    .replace(/-+/g, "-") // إزالة الشرطات المتكررة
    .replace(/^-|-$/g, ""); // إزالة الشرطات من البداية والنهاية
};

/**
 * دالة ضغط الصور باستخدام Sharp
 * @param {string} inputPath - مسار الصورة الأصلية
 * @param {string} outputPath - مسار الصورة المضغوطة
 * @param {string} format - نوع الصورة (jpg, png, webp)
 * @returns {Promise<Object>} - معلومات الصورة المضغوطة
 */
const compressImage = async (inputPath, outputPath, format = "jpg") => {
  console.log(`=== بدء ضغط الصورة ===`);
  console.log(`المسار الأصلي: ${inputPath}`);
  console.log(`مسار الضغط: ${outputPath}`);
  console.log(`التنسيق: ${format}`);

  try {
    const startTime = Date.now();
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    console.log(`الحجم الأصلي: ${originalSize} بايت`);

    // إعدادات الضغط حسب نوع الصورة - تقليل الجودة للاختبار
    let compressionOptions = {};

    // استخدام إعدادات ضغط أكثر شدة للاختبار
    switch (format.toLowerCase()) {
      case "jpg":
      case "jpeg":
        compressionOptions = {
          quality: 90, // تحسين الجودة (0-100)
          progressive: true,
          mozjpeg: true,
        };
        console.log("استخدام إعدادات JPEG للضغط مع جودة 90%");
        break;
      case "png":
        compressionOptions = {
          quality: 90, // تحسين الجودة (0-100)
          progressive: true,
          compressionLevel: 9,
        };
        console.log("استخدام إعدادات PNG للضغط مع جودة 90%");
        break;
      case "webp":
        compressionOptions = {
          quality: 90, // تحسين الجودة (0-100)
          lossless: false,
          nearLossless: false,
        };
        console.log("استخدام إعدادات WebP للضغط مع جودة 90%");
        break;
      default:
        compressionOptions = {
          quality: 90, // تحسين الجودة (0-100)
          progressive: true,
          mozjpeg: true,
        };
        console.log("استخدام إعدادات JPEG الافتراضية للضغط مع جودة 90%");
    }

    // إعدادات تغيير الحجم للحفاظ على الجودة
    const resizeOptions = {
      maxWidth: 3840, // الحفاظ على جودة عالية
      maxHeight: 2160, // الحفاظ على جودة عالية
      fit: "inside",
      withoutEnlargement: true,
    };

    console.log("إعدادات الضغط المعدلة للاختبار:", compressionOptions);
    console.log("إعدادات تغيير الحجم للحفاظ على الجودة:", resizeOptions);

    console.log("بدء عملية الضغط باستخدام Sharp...");
    // ضغط الصورة مع الإعدادات المعدلة
    await sharp(inputPath)
      .resize({
        width: resizeOptions.maxWidth,
        height: resizeOptions.maxHeight,
        fit: resizeOptions.fit,
        withoutEnlargement: resizeOptions.withoutEnlargement,
      })
      .toFormat(format, compressionOptions)
      .toFile(outputPath);
    console.log("اكتملت عملية الضغط");

    // حساب نسبة الضغط
    const compressedStats = fs.statSync(outputPath);
    const compressedSize = compressedStats.size;
    const compressionRatio = (
      ((originalSize - compressedSize) / originalSize) *
      100
    ).toFixed(2);

    console.log(`الحجم بعد الضغط: ${compressedSize} بايت`);
    console.log(`نسبة الضغط: ${compressionRatio}%`);
    console.log(`وقت المعالجة: ${Date.now() - startTime}ms`);

    // حذف الملف الأصلي
    console.log(`حذف الملف الأصلي: ${inputPath}`);
    fs.unlinkSync(inputPath);
    console.log("تم حذف الملف الأصلي");

    const result = {
      success: true,
      originalSize,
      compressedSize,
      compressionRatio: `${compressionRatio}%`,
      processingTime: `${Date.now() - startTime}ms`,
      outputPath,
    };

    console.log("نتيجة الضغط:", result);
    console.log(`=== انتهاء ضغط الصورة ===`);

    return result;
  } catch (error) {
    console.error("خطأ في ضغط الصورة:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * دالة للتحقق من وجود FFmpeg على النظام
 * @returns {Promise<boolean>} - true إذا كان FFmpeg متاحاً، false إذا لم يكن متاحاً
 */
const checkFFmpegAvailability = () => {
  return new Promise((resolve) => {
    const { exec } = require("child_process");
    const platform = os.platform();

    let testCommand;

    if (platform === "win32" && isWindowsFFmpeg) {
      // Windows مع مسار محدد
      const ffmpegPath =
        "C:\\ffmpeg\\ffmpeg-8.0-essentials_build\\bin\\ffmpeg.exe";

      // التحقق من وجود الملف أولاً
      if (!fs.existsSync(ffmpegPath)) {
        console.log("❌ FFmpeg غير موجود في المسار المحدد:", ffmpegPath);
        resolve(false);
        return;
      }

      testCommand = `"${ffmpegPath}" -version`;
    } else {
      // Linux/Unix أو Windows بدون مسار محدد - استخدام PATH
      testCommand = "ffmpeg -version";
    }

    // اختبار تشغيل FFmpeg
    exec(testCommand, (error) => {
      if (error) {
        console.log(
          "❌ FFmpeg غير متاح على النظام - خطأ في التشغيل:",
          error.message
        );
        console.log("💡 تأكد من تثبيت FFmpeg على السيرفر باستخدام:");
        console.log(
          "   Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg"
        );
        console.log("   CentOS/RHEL: sudo yum install ffmpeg");
        console.log("   Alpine: apk add ffmpeg");
        resolve(false);
      } else {
        console.log("✅ FFmpeg متاح على النظام");
        resolve(true);
      }
    });
  });
};

/**
 * دالة ضغط الفيديو باستخدام FFmpeg
 * @param {string} inputPath - مسار الفيديو الأصلي
 * @param {string} outputPath - مسار الفيديو المضغوط
 * @param {string} format - نوع الفيديو (mp4, webm)
 * @returns {Promise<Object>} - معلومات الفيديو المضغوط
 */
const compressVideo = async (inputPath, outputPath, format = "mp4") => {
  console.log(`=== بدء ضغط الفيديو ===`);
  console.log(`المسار الأصلي: ${inputPath}`);
  console.log(`مسار الضغط: ${outputPath}`);
  console.log(`التنسيق: ${format}`);

  // التحقق من وجود FFmpeg أولاً
  const isFFmpegAvailable = await checkFFmpegAvailability();

  if (!isFFmpegAvailable) {
    console.error("🚨 ===== تحذير مهم: FFmpeg غير متاح ===== 🚨");
    console.error("❌ خطأ: FFmpeg غير مثبت على النظام");
    console.error("🌍 نظام التشغيل:", os.platform());
    console.error("📁 مجلد العمل:", process.cwd());
    console.error("");
    console.error("💡 لحل هذه المشكلة على السيرفر:");
    console.error("   Ubuntu/Debian: sudo apt update && sudo apt install ffmpeg");
    console.error("   CentOS/RHEL: sudo yum install epel-release && sudo yum install ffmpeg");
    console.error("   Alpine: apk add ffmpeg");
    console.error("");
    console.error("🔍 للتحقق من التثبيت: ffmpeg -version");
    console.error("================================================");

    // إرجاع الملف الأصلي بدون ضغط مع رسالة تحذيرية
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;
    const originalSizeMB = (originalSize / (1024 * 1024)).toFixed(2);

    console.warn(`⚠️ سيتم حفظ الفيديو بدون ضغط (${originalSizeMB} MB)`);

    // نسخ الملف إلى المسار الجديد بدلاً من الضغط
    fs.copyFileSync(inputPath, outputPath);

    // حذف الملف الأصلي
    fs.unlinkSync(inputPath);

    return {
      success: true,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: "0%",
      processingTime: "0ms",
      outputPath,
      warning: `FFmpeg غير متاح - تم حفظ الفيديو بدون ضغط (${originalSizeMB} MB)`,
      ffmpegMissing: true,
      systemInfo: {
        platform: os.platform(),
        workingDirectory: process.cwd()
      }
    };
  }

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const originalStats = fs.statSync(inputPath);
    const originalSize = originalStats.size;

    console.log(`الحجم الأصلي: ${originalSize} بايت`);

    // إعدادات الضغط حسب نوع الفيديو
    let compressionOptions = {};

    switch (format.toLowerCase()) {
      case "mp4":
        compressionOptions = VIDEO_COMPRESSION_SETTINGS.h264;
        break;
      case "webm":
        compressionOptions = VIDEO_COMPRESSION_SETTINGS.webm;
        break;
      default:
        compressionOptions = VIDEO_COMPRESSION_SETTINGS.h264;
    }

    console.log("إعدادات الضغط:", compressionOptions);

    try {
      // إعداد FFmpeg
      let command = ffmpeg(inputPath).outputOptions([
        `-c:v ${compressionOptions.codec}`,
        `-preset ${compressionOptions.preset}`,
        `-crf ${compressionOptions.crf}`,
        `-maxrate ${compressionOptions.maxrate}`,
        `-bufsize ${compressionOptions.bufsize}`,
        `-c:a ${VIDEO_COMPRESSION_SETTINGS.audio.codec}`,
        `-b:a ${VIDEO_COMPRESSION_SETTINGS.audio.bitrate}`,
        "-movflags +faststart", // تحسين التحميل
      ]);

      // إضافة خيارات الحجم إذا كان الفيديو كبير جداً
      command = command.videoFilters([
        `scale=w='if(gt(iw,${VIDEO_COMPRESSION_SETTINGS.resize.maxWidth}),${VIDEO_COMPRESSION_SETTINGS.resize.maxWidth},iw)':h='if(gt(ih,${VIDEO_COMPRESSION_SETTINGS.resize.maxHeight}),${VIDEO_COMPRESSION_SETTINGS.resize.maxHeight},ih)'`,
      ]);

      console.log("بدء عملية الضغط باستخدام FFmpeg...");

      // معالجة الأحداث
      command
        .on("start", (commandLine) => {
          console.log("أمر FFmpeg:", commandLine);
        })
        .on("end", () => {
          try {
            console.log("اكتملت عملية الضغط");
            const compressedStats = fs.statSync(outputPath);
            const compressedSize = compressedStats.size;
            const compressionRatio = (
              ((originalSize - compressedSize) / originalSize) *
              100
            ).toFixed(2);

            console.log(`الحجم بعد الضغط: ${compressedSize} بايت`);
            console.log(`نسبة الضغط: ${compressionRatio}%`);
            console.log(`وقت المعالجة: ${Date.now() - startTime}ms`);

            // حذف الملف الأصلي
            console.log(`حذف الملف الأصلي: ${inputPath}`);
            fs.unlinkSync(inputPath);
            console.log("تم حذف الملف الأصلي");

            const result = {
              success: true,
              originalSize,
              compressedSize,
              compressionRatio: `${compressionRatio}%`,
              processingTime: `${Date.now() - startTime}ms`,
              outputPath,
            };

            console.log("نتيجة الضغط:", result);
            console.log(`=== انتهاء ضغط الفيديو ===`);

            resolve(result);
          } catch (error) {
            console.error("خطأ في معالجة نتيجة الضغط:", error);
            reject({
              success: false,
              error: error.message,
            });
          }
        })
        .on("error", (error) => {
          console.error("خطأ في FFmpeg:", error);
          reject({
            success: false,
            error: error.message,
            ffmpegError: true,
          });
        })
        .on("progress", (progress) => {
          if (progress.percent) {
            console.log(`تقدم المعالجة: ${Math.round(progress.percent)}%`);
          }
        })
        .save(outputPath);
    } catch (error) {
      console.error("خطأ في إعداد FFmpeg:", error);
      reject({
        success: false,
        error: error.message,
        setupError: true,
      });
    }
  });
};

/**
 * دالة ضغط الملفات حسب نوعها
 * @param {Object} file - كائن الملف المرفوع
 * @returns {Promise<Object>} - نتيجة الضغط
 */
const compressFile = async (file) => {
  console.log(`=== بدء ضغط الملف ===`);
  console.log("كائن الملف:", file);

  try {
    // التحقق من وجود الخصائص المطلوبة
    if (!file || !file.mimetype || !file.path) {
      console.error("خطأ: كائن الملف غير صالح أو يفتقد إلى الخصائص المطلوبة");
      console.error("الخصائص المطلوبة: mimetype, path");
      return {
        success: false,
        error: "Invalid file object or missing required properties",
      };
    }

    console.log(
      `نوع الملف: ${file.mimetype}, الحجم: ${file.size || "غير معروف"} بايت`
    );

    const isImage = file.mimetype.startsWith("image/");
    const isVideo = file.mimetype.startsWith("video/");

    console.log(
      `نوع الوسائط: ${isImage ? "صورة" : isVideo ? "فيديو" : "غير معروف"}`
    );

    if (!isImage && !isVideo) {
      console.log("نوع الملف غير مدعوم للضغط");
      return {
        success: false,
        error: "Unsupported file type for compression",
      };
    }

    const inputPath = file.path;
    console.log(`المسار الأصلي: ${inputPath}`);

    // التحقق من وجود الملف
    if (!fs.existsSync(inputPath)) {
      console.error(`خطأ: الملف غير موجود في المسار: ${inputPath}`);
      return {
        success: false,
        error: `File not found at path: ${inputPath}`,
      };
    }

    const extension = ALLOWED_EXTENSIONS[file.mimetype] || "file";
    const filename = file.filename || path.basename(inputPath);
    const compressedFilename = `compressed-${filename}`;
    const outputPath = path.join(path.dirname(inputPath), compressedFilename);

    console.log(`الامتداد: ${extension}`);
    console.log(`اسم الملف المضغوط: ${compressedFilename}`);
    console.log(`مسار الملف المضغوط: ${outputPath}`);

    // تعيين جودة ضغط أعلى للتأكد من ظهور الفرق
    if (isImage) {
      // إنشاء نسخة من إعدادات الضغط للاختبار
      console.log("إعدادات الضغط الأصلية:", IMAGE_COMPRESSION_SETTINGS);
      console.log("بدء ضغط الصورة مع تقليل الجودة للاختبار...");

      const result = await compressImage(inputPath, outputPath, extension);
      return result;
    } else if (isVideo) {
      console.log("بدء ضغط الفيديو...");
      const result = await compressVideo(inputPath, outputPath, extension);
      return result;
    }

    return {
      success: false,
      error: "Unknown error in compression",
    };
  } catch (error) {
    console.error("خطأ أثناء ضغط الملف:", error);
    console.error(error.stack); // طباعة stack trace للحصول على مزيد من المعلومات
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * دالة لإنشاء storage مخصص لنوع محتوى معين
 * @param {string} contentType - نوع المحتوى (categories, products, users, etc.)
 * @returns {Object} - كائن multer storage
 */
const createCustomStorage = (contentType) => {
  return multer.diskStorage({
    /**
     * دالة تحديد مجلد الحفظ
     * destination: تحدد أين سيتم حفظ الملف
     * @param {Object} req - كائن الطلب
     * @param {Object} file - كائن الملف المرفوع
     * @param {Function} cb - دالة callback للعودة بالنتيجة
     */
    destination: function (req, file, cb) {
      // تحديد نوع الملف واختيار المجلد المناسب
      let fileType = "";

      if (file.mimetype.startsWith("image/")) {
        fileType = "images";
      } else if (file.mimetype.startsWith("video/")) {
        fileType = "videos";
      }

      // إنشاء مسار المجلد حسب نوع المحتوى
      const uploadFolder = getUploadPath(contentType, fileType);

      // إنشاء المجلد إذا لم يكن موجوداً
      createFolderIfNotExists(uploadFolder);

      console.log(`📁 حفظ ملف ${contentType} في: ${uploadFolder}`);

      // إرجاع مسار المجلد (null = لا توجد أخطاء)
      cb(null, uploadFolder);
    },

    /**
     * دالة تحديد اسم الملف
     * filename: تحدد اسم الملف عند الحفظ
     * @param {Object} req - كائن الطلب
     * @param {Object} file - كائن الملف المرفوع
     * @param {Function} cb - دالة callback للعودة بالنتيجة
     */
    filename: function (req, file, cb) {
      // الحصول على اسم الملف الأصلي بدون الامتداد
      const originalName = path.parse(file.originalname).name;

      // تنظيف اسم الملف
      const cleanName = sanitizeFilename(originalName);

      // الحصول على الامتداد المناسب من ALLOWED_EXTENSIONS
      const extension = ALLOWED_EXTENSIONS[file.mimetype] || "file";

      // إنشاء اسم فريد للملف (الاسم + الوقت الحالي + الامتداد)
      const uniqueName = `${cleanName}-${Date.now()}.${extension}`;

      console.log(`📝 اسم الملف النهائي لـ ${contentType}: ${uniqueName}`);

      // إرجاع اسم الملف النهائي
      cb(null, uniqueName);
    },
  });
};

/**
 * إعداد التخزين الافتراضي على القرص الصلب (للتوافق مع الكود القديم)
 * diskStorage: يحدد كيفية حفظ الملفات على القرص
 */
const storage = multer.diskStorage({
  /**
   * دالة تحديد مجلد الحفظ
   * destination: تحدد أين سيتم حفظ الملف
   * @param {Object} req - كائن الطلب (غير مستخدم هنا)
   * @param {Object} file - كائن الملف المرفوع
   * @param {Function} cb - دالة callback للعودة بالنتيجة
   */
  destination: function (req, file, cb) {
    // تحديد نوع الملف واختيار المجلد المناسب
    let uploadFolder = "public/uploads/";

    if (file.mimetype.startsWith("image/")) {
      uploadFolder += "images/";
    } else if (file.mimetype.startsWith("video/")) {
      uploadFolder += "videos/";
    }

    // إنشاء المجلد إذا لم يكن موجوداً
    createFolderIfNotExists(uploadFolder);

    // إرجاع مسار المجلد (null = لا توجد أخطاء)
    cb(null, uploadFolder);
  },

  /**
   * دالة تحديد اسم الملف
   * filename: تحدد اسم الملف عند الحفظ
   * @param {Object} req - كائن الطلب (غير مستخدم هنا)
   * @param {Object} file - كائن الملف المرفوع
   * @param {Function} cb - دالة callback للعودة بالنتيجة
   */
  filename: function (req, file, cb) {
    // الحصول على اسم الملف الأصلي بدون الامتداد
    const originalName = path.parse(file.originalname).name;

    // تنظيف اسم الملف
    const cleanName = sanitizeFilename(originalName);

    // الحصول على الامتداد المناسب من ALLOWED_EXTENSIONS
    const extension = ALLOWED_EXTENSIONS[file.mimetype] || "file";

    // إنشاء اسم فريد للملف (الاسم + الوقت الحالي + الامتداد)
    const uniqueName = `${cleanName}-${Date.now()}.${extension}`;

    // إرجاع اسم الملف النهائي
    cb(null, uniqueName);
  },
});

/**
 * دالة فلترة الملفات - تتحقق من نوع الملف
 * @param {Object} req - كائن الطلب
 * @param {Object} file - كائن الملف المرفوع
 * @param {Function} cb - دالة callback للعودة بالنتيجة
 */
const fileFilter = (req, file, cb) => {
  // التحقق من أن نوع الملف مسموح به
  const isValid = ALLOWED_EXTENSIONS[file.mimetype];

  if (!isValid) {
    // إنشاء رسالة خطأ مفصلة
    const error = new Error(
      `Invalid file type!\nFile type: ${
        file.mimetype
      }\nAllowed types: ${Object.keys(ALLOWED_EXTENSIONS).join(", ")}`
    );
    error.code = "INVALID_FILE_TYPE";
    return cb(error, false);
  }

  // قبول الملف إذا كان نوعه صحيح
  cb(null, true);
};

/**
 * إعداد حدود رفع الملفات
 * limits: تحدد القيود على الملفات المرفوعة
 */
const limits = {
  fileSize: 100 * 1024 * 1024, // 100 ميجابايت كحد أقصى (زيادة للفيديو)
  files: 10, // عدد الملفات المسموح برفعها في طلب واحد
};

/**
 * إنشاء مثيل multer لرفع صورة واحدة مع ضغط
 * single: لرفع ملف واحد فقط
 */
const uploadSingleImage = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 ميجابايت للصور (زيادة للضغط)
    files: 1,
  },
}).single("image"); // 'image' هو اسم الحقل في النموذج

/**
 * إنشاء مثيل multer لرفع فيديو واحد مع ضغط
 */
const uploadSingleVideo = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 ميجابايت للفيديو (زيادة للضغط)
    files: 1,
  },
}).single("video"); // 'video' هو اسم الحقل في النموذج

/**
 * إنشاء مثيل multer لرفع صور متعددة مع ضغط
 * array: لرفع عدة ملفات من نفس النوع
 */
const uploadMultipleImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 ميجابايت لكل صورة
    files: 10, // عدد الصور المسموح برفعها
  },
}).array("images", 10); // 'images' هو اسم الحقل، 10 هو الحد الأقصى

/**
 * إنشاء مثيل multer لرفع فيديوهات متعددة مع ضغط
 */
const uploadMultipleVideos = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 ميجابايت لكل فيديو
    files: 5, // عدد الفيديوهات المسموح برفعها
  },
}).array("videos", 5); // 'videos' هو اسم الحقل، 5 هو الحد الأقصى

/**
 * إنشاء مثيل multer لرفع ملفات مختلطة (صور وفيديو) مع ضغط
 * fields: لرفع ملفات من أنواع مختلفة
 */
const uploadMixedFiles = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: limits,
}).fields([
  { name: "images", maxCount: 5 }, // صور متعددة
  { name: "videos", maxCount: 2 }, // فيديوهات متعددة
  { name: "image", maxCount: 1 }, // صورة واحدة
  { name: "video", maxCount: 1 }, // فيديو واحد
]);

/**
 * دالة مساعدة لمعالجة أخطاء رفع الملفات
 * @param {Error} error - كائن الخطأ
 * @returns {Object} - رسالة خطأ منسقة
 */
const handleUploadError = (error) => {
  let message = "An error occurred while uploading the file";
  let statusCode = 400;

  if (error.code === "LIMIT_FILE_SIZE") {
    message = "File size is too large";
    statusCode = 413;
  } else if (error.code === "LIMIT_FILE_COUNT") {
    message = "Too many files";
    statusCode = 413;
  } else if (error.code === "INVALID_FILE_TYPE") {
    message = error.message;
    statusCode = 400;
  } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
    message = "Unexpected file type";
    statusCode = 400;
  }

  return {
    success: false,
    message: message,
    statusCode: statusCode,
    error: error.message,
  };
};

/**
 * دالة مساعدة لإنشاء استجابة نجاح مع معلومات الضغط
 * @param {Object} file - كائن الملف المرفوع
 * @param {Object} compressionInfo - معلومات الضغط
 * @returns {Object} - استجابة نجاح منسقة
 */
const createSuccessResponse = (file, compressionInfo = null) => {
  const response = {
    success: true,
    message: "File uploaded successfully",
    data: {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/public/uploads/${
        file.mimetype.startsWith("image/") ? "images" : "videos"
      }/${file.filename}`,
    },
  };

  // إضافة معلومات الضغط إذا كانت متوفرة
  if (compressionInfo && compressionInfo.success) {
    response.data.compression = {
      originalSize: compressionInfo.originalSize,
      compressedSize: compressionInfo.compressedSize,
      compressionRatio: compressionInfo.compressionRatio,
      processingTime: compressionInfo.processingTime,
    };
    response.message = "File uploaded and compressed successfully";
  }

  return response;
};

/**
 * دالة مساعدة لإنشاء استجابة نجاح لملفات متعددة مع معلومات الضغط
 * @param {Array} files - مصفوفة الملفات المرفوعة
 * @param {Array} compressionResults - نتائج الضغط
 * @returns {Object} - استجابة نجاح منسقة
 */
const createMultipleSuccessResponse = (files, compressionResults = []) => {
  const uploadedFiles = files.map((file, index) => {
    const fileData = {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: `/public/uploads/${
        file.mimetype.startsWith("image/") ? "images" : "videos"
      }/${file.filename}`,
    };

    // إضافة معلومات الضغط إذا كانت متوفرة
    if (compressionResults[index] && compressionResults[index].success) {
      fileData.compression = {
        originalSize: compressionResults[index].originalSize,
        compressedSize: compressionResults[index].compressedSize,
        compressionRatio: compressionResults[index].compressionRatio,
        processingTime: compressionResults[index].processingTime,
      };
    }

    return fileData;
  });

  const compressedCount = compressionResults.filter(
    (result) => result && result.success
  ).length;
  const message =
    compressedCount > 0
      ? `${files.length} files uploaded and ${compressedCount} compressed successfully`
      : `${files.length} files uploaded successfully`;

  return {
    success: true,
    message: message,
    data: {
      count: files.length,
      compressedCount,
      files: uploadedFiles,
    },
  };
};

/**
 * دالة حذف ملف واحد من النظام
 * @param {string} filePath - مسار الملف المراد حذفه
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteFile = async (filePath) => {
  try {
    console.log(`محاولة حذف الملف: ${filePath}`);

    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      console.log(`❌ الملف غير موجود: ${filePath}`);
      return {
        success: false,
        message: "File not found",
        error: "File does not exist",
        filePath: filePath,
      };
    }

    console.log(`✅ الملف موجود، بدء الحذف: ${filePath}`);

    // حذف الملف
    await fs.promises.unlink(filePath);

    console.log(`✅ تم حذف الملف بنجاح: ${filePath}`);

    return {
      success: true,
      message: "File deleted successfully",
      deletedPath: filePath,
    };
  } catch (error) {
    console.error(`❌ خطأ في حذف الملف ${filePath}:`, error);
    return {
      success: false,
      message: "Failed to delete file",
      error: error.message,
      filePath: filePath,
    };
  }
};

/**
 * دالة حذف ملف من URL أو مسار نسبي
 * @param {string} fileUrl - URL الملف أو المسار النسبي
 * @param {string} basePath - المسار الأساسي (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteFileFromUrl = async (fileUrl, basePath = "public") => {
  try {
    console.log(`=== بدء حذف الملف من URL: ${fileUrl} ===`);

    // تنظيف URL من backslashes وتحويلها إلى forward slashes
    const cleanUrl = fileUrl.replace(/\\/g, "/");
    console.log(`URL بعد التنظيف: ${cleanUrl}`);

    // استخراج المسار النسبي من URL
    let relativePath = "";

    if (cleanUrl.includes("http://") || cleanUrl.includes("https://")) {
      // إذا كان URL كامل، استخراج الجزء بعد domain
      const urlParts = cleanUrl.split("/");
      console.log(`أجزاء URL: ${JSON.stringify(urlParts)}`);

      // البحث عن public في URL
      const publicIndex = urlParts.findIndex((part) => part === "public");
      if (publicIndex !== -1) {
        relativePath = urlParts.slice(publicIndex).join("/");
        console.log(
          `تم العثور على public في الفهرس ${publicIndex}, المسار النسبي: ${relativePath}`
        );
      } else {
        // البحث عن uploads في URL
        const uploadsIndex = urlParts.findIndex((part) => part === "uploads");
        if (uploadsIndex !== -1) {
          relativePath = `public/${urlParts.slice(uploadsIndex).join("/")}`;
          console.log(
            `تم العثور على uploads في الفهرس ${uploadsIndex}, المسار النسبي: ${relativePath}`
          );
        } else {
          // استخراج اسم الملف فقط وتحديد نوعه
          const fileName = urlParts[urlParts.length - 1];
          console.log(`اسم الملف المستخرج: ${fileName}`);

          const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileName);
          const isVideo = /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(fileName);

          if (isImage) {
            relativePath = `public/uploads/images/${fileName}`;
          } else if (isVideo) {
            relativePath = `public/uploads/videos/${fileName}`;
          } else {
            console.log(`❌ نوع ملف غير مدعوم: ${fileName}`);
            return {
              success: false,
              message: "Unsupported file type",
              error: `Cannot determine file type for: ${fileName}`,
            };
          }
          console.log(
            `تم تحديد المسار النسبي بناءً على نوع الملف: ${relativePath}`
          );
        }
      }
    } else {
      // إذا كان مسار نسبي
      const cleanRelativePath = cleanUrl.replace(/\\/g, "/");
      relativePath = cleanRelativePath.startsWith("public/")
        ? cleanRelativePath
        : `public/${cleanRelativePath}`;
      console.log(`مسار نسبي: ${relativePath}`);
    }

    console.log(`✅ المسار النسبي النهائي: ${relativePath}`);

    // بناء المسار الكامل باستخدام path.resolve
    const fullPath = path.resolve(relativePath);
    console.log(`✅ المسار الكامل للملف: ${fullPath}`);

    // حذف الملف
    const result = await deleteFile(fullPath);
    console.log(`✅ نتيجة حذف الملف: ${JSON.stringify(result)}`);

    return result;
  } catch (error) {
    console.error("❌ خطأ في حذف الملف من URL:", error);
    return {
      success: false,
      message: "Failed to delete file from URL",
      error: error.message,
      fileUrl: fileUrl,
    };
  }
};

/**
 * دالة حذف عدة ملفات من قائمة URLs مع دعم المجلدات المخصصة
 * @param {Array} fileUrls - مصفوفة URLs الملفات
 * @param {string} contentType - نوع المحتوى (categories, products, users) - اختياري
 * @param {string} basePath - المسار الأساسي
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteMultipleFiles = async (
  fileUrls,
  contentType = null,
  basePath = "public"
) => {
  try {
    console.log(`=== بدء حذف ${fileUrls.length} ملفات ===`);
    console.log("قائمة الملفات المراد حذفها:", fileUrls);
    console.log("نوع المحتوى:", contentType);

    const results = [];
    let deletedCount = 0;
    let failedCount = 0;

    for (const fileIdentifier of fileUrls) {
      console.log(`محاولة حذف الملف: ${fileIdentifier}`);
      let result;

      // تحديد ما إذا كان URL كامل أم اسم ملف فقط
      if (
        fileIdentifier.includes("http://") ||
        fileIdentifier.includes("https://") ||
        fileIdentifier.includes("/")
      ) {
        // إذا كان URL كامل أو مسار
        result = await deleteFileFromUrl(fileIdentifier, basePath);
      } else {
        // إذا كان اسم ملف فقط، تحديد نوع الملف وحذفه
        // Fix: Correctly identify webp files (they have .webp extension, not .webm)
        const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(fileIdentifier);
        const fileType = isImage ? "images" : "videos";

        let filePath;
        if (contentType) {
          // استخدام المجلد المخصص للمحتوى
          filePath = path.resolve(
            `public/uploads/${fileType}/${contentType}/${fileIdentifier}`
          );
          console.log(
            `حذف ملف ${contentType} بالاسم: ${fileIdentifier} من المسار: ${filePath}`
          );
        } else {
          // استخدام المجلد القديم للتوافق
          filePath = path.resolve(
            `public/uploads/${fileType}/${fileIdentifier}`
          );
          console.log(
            `حذف ملف بالاسم: ${fileIdentifier} من المسار: ${filePath}`
          );
        }

        result = await deleteFile(filePath);

        // إذا فشل الحذف من المجلد المخصص، جرب المجلد القديم
        if (!result.success && contentType) {
          console.log(
            `فشل الحذف من المجلد المخصص، محاولة الحذف من المجلد القديم...`
          );
          const oldFilePath = path.resolve(
            `public/uploads/${fileType}/${fileIdentifier}`
          );
          result = await deleteFile(oldFilePath);
          console.log(`نتيجة الحذف من المجلد القديم: ${result.success}`);
        }
      }

      results.push(result);

      if (result.success) {
        deletedCount++;
        console.log(`✅ تم حذف الملف بنجاح: ${fileIdentifier}`);
      } else {
        failedCount++;
        console.log(
          `❌ فشل حذف الملف: ${fileIdentifier} - السبب: ${result.error}`
        );
      }
    }

    console.log(
      `=== انتهاء عملية الحذف - تم حذف ${deletedCount} ملفات، فشل ${failedCount} ملفات ===`
    );

    return {
      success: true,
      message: `Deleted ${deletedCount} files, ${failedCount} failed`,
      data: {
        totalFiles: fileUrls.length,
        deletedCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error deleting multiple files:", error);
    return {
      success: false,
      message: "Failed to delete multiple files",
      error: error.message,
    };
  }
};

/**
 * دالة حذف صورة واحدة من مجلد uploads
 * @param {string} imageName - اسم الصورة (مثال: 'image.jpg')
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteImage = async (imageName, uploadPath = "public/uploads") => {
  try {
    const imagePath = path.join(uploadPath, "images", imageName);

    // التحقق من وجود الصورة
    if (!fs.existsSync(imagePath)) {
      return {
        success: false,
        message: "Image not found",
        error: `Image '${imageName}' does not exist in ${uploadPath}/images/`,
      };
    }

    // حذف الصورة
    await fs.promises.unlink(imagePath);

    return {
      success: true,
      message: "Image deleted successfully",
      deletedImage: imageName,
      deletedPath: imagePath,
    };
  } catch (error) {
    console.error("Error deleting image:", error);
    return {
      success: false,
      message: "Failed to delete image",
      error: error.message,
    };
  }
};

/**
 * دالة حذف فيديو واحد من مجلد uploads
 * @param {string} videoName - اسم الفيديو (مثال: 'video.mp4')
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteVideo = async (videoName, uploadPath = "public/uploads") => {
  try {
    const videoPath = path.join(uploadPath, "videos", videoName);

    // التحقق من وجود الفيديو
    if (!fs.existsSync(videoPath)) {
      return {
        success: false,
        message: "Video not found",
        error: `Video '${videoName}' does not exist in ${uploadPath}/videos/`,
      };
    }

    // حذف الفيديو
    await fs.promises.unlink(videoPath);

    return {
      success: true,
      message: "Video deleted successfully",
      deletedVideo: videoName,
      deletedPath: videoPath,
    };
  } catch (error) {
    console.error("Error deleting video:", error);
    return {
      success: false,
      message: "Failed to delete video",
      error: error.message,
    };
  }
};

/**
 * دالة حذف عدة صور من مجلد uploads
 * @param {Array} imageNames - مصفوفة أسماء الصور
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteMultipleImages = async (
  imageNames,
  uploadPath = "public/uploads"
) => {
  try {
    const results = [];
    let deletedCount = 0;
    let failedCount = 0;

    for (const imageName of imageNames) {
      const result = await deleteImage(imageName, uploadPath);
      results.push({ imageName, result });

      if (result.success) {
        deletedCount++;
      } else {
        failedCount++;
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} images, ${failedCount} failed`,
      data: {
        totalImages: imageNames.length,
        deletedCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error deleting multiple images:", error);
    return {
      success: false,
      message: "Failed to delete multiple images",
      error: error.message,
    };
  }
};

/**
 * دالة حذف عدة فيديوهات من مجلد uploads
 * @param {Array} videoNames - مصفوفة أسماء الفيديوهات
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteMultipleVideos = async (
  videoNames,
  uploadPath = "public/uploads"
) => {
  try {
    const results = [];
    let deletedCount = 0;
    let failedCount = 0;

    for (const videoName of videoNames) {
      const result = await deleteVideo(videoName, uploadPath);
      results.push({ videoName, result });

      if (result.success) {
        deletedCount++;
      } else {
        failedCount++;
      }
    }

    return {
      success: true,
      message: `Deleted ${deletedCount} videos, ${failedCount} failed`,
      data: {
        totalVideos: videoNames.length,
        deletedCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error deleting multiple videos:", error);
    return {
      success: false,
      message: "Failed to delete multiple videos",
      error: error.message,
    };
  }
};

/**
 * دالة حذف ملف من مسار كامل
 * @param {string} filePath - المسار الكامل للملف
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteFileByPath = async (filePath) => {
  try {
    // التحقق من وجود الملف
    if (!fs.existsSync(filePath)) {
      return {
        success: false,
        message: "File not found",
        error: `File does not exist: ${filePath}`,
      };
    }

    // التحقق من أن الملف في مجلد uploads
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.includes("uploads")) {
      return {
        success: false,
        message: "Access denied",
        error: "Can only delete files from uploads directory",
      };
    }

    // حذف الملف
    await fs.promises.unlink(filePath);

    return {
      success: true,
      message: "File deleted successfully",
      deletedPath: filePath,
    };
  } catch (error) {
    console.error("Error deleting file by path:", error);
    return {
      success: false,
      message: "Failed to delete file",
      error: error.message,
    };
  }
};

/**
 * دالة حذف جميع الصور من مجلد uploads
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteAllImages = async (uploadPath = "public/uploads") => {
  try {
    const imagesPath = path.join(uploadPath, "images");

    // التحقق من وجود مجلد الصور
    if (!fs.existsSync(imagesPath)) {
      return {
        success: false,
        message: "Images directory not found",
        error: `Directory does not exist: ${imagesPath}`,
      };
    }

    // قراءة جميع الملفات في مجلد الصور
    const files = fs.readdirSync(imagesPath);
    const imageFiles = files.filter((file) =>
      /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file)
    );

    if (imageFiles.length === 0) {
      return {
        success: true,
        message: "No images found to delete",
        data: { deletedCount: 0 },
      };
    }

    // حذف جميع الصور
    const results = [];
    for (const imageFile of imageFiles) {
      const result = await deleteImage(imageFile, uploadPath);
      results.push({ imageFile, result });
    }

    const deletedCount = results.filter((r) => r.result.success).length;
    const failedCount = results.filter((r) => !r.result.success).length;

    return {
      success: true,
      message: `Deleted ${deletedCount} images, ${failedCount} failed`,
      data: {
        totalImages: imageFiles.length,
        deletedCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error deleting all images:", error);
    return {
      success: false,
      message: "Failed to delete all images",
      error: error.message,
    };
  }
};

/**
 * دالة حذف جميع الفيديوهات من مجلد uploads
 * @param {string} uploadPath - مسار مجلد uploads (افتراضي: 'public/uploads')
 * @returns {Promise<Object>} - نتيجة الحذف
 */
const deleteAllVideos = async (uploadPath = "public/uploads") => {
  try {
    const videosPath = path.join(uploadPath, "videos");

    // التحقق من وجود مجلد الفيديوهات
    if (!fs.existsSync(videosPath)) {
      return {
        success: false,
        message: "Videos directory not found",
        error: `Directory does not exist: ${videosPath}`,
      };
    }

    // قراءة جميع الملفات في مجلد الفيديوهات
    const files = fs.readdirSync(videosPath);
    const videoFiles = files.filter((file) =>
      /\.(mp4|avi|mov|wmv|flv|webm|mkv)$/i.test(file)
    );

    if (videoFiles.length === 0) {
      return {
        success: true,
        message: "No videos found to delete",
        data: { deletedCount: 0 },
      };
    }

    // حذف جميع الفيديوهات
    const results = [];
    for (const videoFile of videoFiles) {
      const result = await deleteVideo(videoFile, uploadPath);
      results.push({ videoFile, result });
    }

    const deletedCount = results.filter((r) => r.result.success).length;
    const failedCount = results.filter((r) => !r.result.success).length;

    return {
      success: true,
      message: `Deleted ${deletedCount} videos, ${failedCount} failed`,
      data: {
        totalVideos: videoFiles.length,
        deletedCount,
        failedCount,
        results,
      },
    };
  } catch (error) {
    console.error("Error deleting all videos:", error);
    return {
      success: false,
      message: "Failed to delete all videos",
      error: error.message,
    };
  }
};

/**
 * دالة مساعدة لضغط الملفات بعد رفعها
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} uploadFunction - دالة رفع الملفات (multer)
 * @param {boolean} compress - هل يتم ضغط الملفات بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadAndCompress = async (req, res, uploadFunction, compress = true) => {
  return new Promise((resolve, reject) => {
    // تنفيذ دالة رفع الملفات
    uploadFunction(req, res, async (err) => {
      if (err) {
        return reject(err);
      }

      // إذا لم يكن الضغط مطلوباً، نضيف dbFileName ثم نعيد النتيجة مباشرة
      if (!compress) {
        try {
          if (req.file) {
            const normalizedPath = String(
              req.file.path || req.file.filename || ""
            ).replace(/\\/g, "/");
            req.file.dbFileName = normalizedPath.split("/").pop();
          } else if (req.files && Array.isArray(req.files)) {
            for (let i = 0; i < req.files.length; i++) {
              const f = req.files[i];
              const normalizedPath = String(f.path || f.filename || "").replace(
                /\\/g,
                "/"
              );
              req.files[i].dbFileName = normalizedPath.split("/").pop();
            }
          } else if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
              for (let i = 0; i < req.files[fieldName].length; i++) {
                const f = req.files[fieldName][i];
                const normalizedPath = String(
                  f.path || f.filename || ""
                ).replace(/\\/g, "/");
                req.files[fieldName][i].dbFileName = normalizedPath
                  .split("/")
                  .pop();
              }
            }
          }
        } catch (annotateErr) {
          console.error("خطأ أثناء تعيين dbFileName بدون ضغط:", annotateErr);
        }
        return resolve({ compressed: false });
      }

      try {
        console.log("=== بدء عملية ضغط الملفات بعد الرفع ===");

        // ضغط ملف واحد (في حالة uploadSingleImage أو uploadSingleVideo)
        if (req.file) {
          console.log(`ضغط ملف واحد: ${req.file.originalname}`);
          const compressResult = await compressFile(req.file);

          if (compressResult.success) {
            // تحديث مسار الملف بعد الضغط
            req.file.path = compressResult.outputPath.replace(/^.*[\\\/]/, "");
            req.file.size = compressResult.compressedSize;
            // إضافة اسم الملف لقاعدة البيانات (اسم فقط)
            try {
              const normalizedPath = String(
                compressResult.outputPath ||
                  req.file.path ||
                  req.file.filename ||
                  ""
              ).replace(/\\/g, "/");
              req.file.dbFileName = normalizedPath.split("/").pop();
            } catch (e) {
              console.error("خطأ أثناء تعيين dbFileName لملف واحد:", e);
            }
            console.log(
              `تم ضغط الملف: ${req.file.originalname}, الحجم الجديد: ${req.file.size}`
            );
          }

          return resolve({
            compressed: true,
            singleFile: true,
            result: compressResult,
          });
        }

        // ضغط ملفات متعددة (في حالة uploadMultipleImages أو uploadMultipleVideos)
        if (req.files && Array.isArray(req.files)) {
          console.log(`ضغط ${req.files.length} ملفات`);
          const compressResults = [];

          for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const compressResult = await compressFile(file);
            compressResults.push(compressResult);

            if (compressResult.success) {
              // تحديث مسار الملف بعد الضغط
              req.files[i].path = compressResult.outputPath.replace(
                /^.*[\\\/]/,
                ""
              );
              req.files[i].size = compressResult.compressedSize;
              // إضافة اسم الملف لقاعدة البيانات (اسم فقط)
              try {
                const normalizedPath = String(
                  compressResult.outputPath ||
                    req.files[i].path ||
                    req.files[i].filename ||
                    ""
                ).replace(/\\/g, "/");
                req.files[i].dbFileName = normalizedPath.split("/").pop();
              } catch (e) {
                console.error("خطأ أثناء تعيين dbFileName لملفات متعددة:", e);
              }
              console.log(
                `تم ضغط الملف ${i + 1}: ${file.originalname}, الحجم الجديد: ${
                  req.files[i].size
                }`
              );
            }
          }

          return resolve({
            compressed: true,
            multipleFiles: true,
            results: compressResults,
          });
        }

        // ضغط ملفات مختلطة (في حالة uploadMixedFiles)
        if (req.files && !Array.isArray(req.files)) {
          console.log("ضغط ملفات مختلطة");
          const compressResults = {};

          for (const fieldName in req.files) {
            compressResults[fieldName] = [];

            for (let i = 0; i < req.files[fieldName].length; i++) {
              const file = req.files[fieldName][i];
              const compressResult = await compressFile(file);
              compressResults[fieldName].push(compressResult);

              if (compressResult.success) {
                // تحديث مسار الملف بعد الضغط
                req.files[fieldName][i].path =
                  compressResult.outputPath.replace(/^.*[\\\/]/, "");
                req.files[fieldName][i].size = compressResult.compressedSize;
                // إضافة اسم الملف لقاعدة البيانات (اسم فقط)
                try {
                  const normalizedPath = String(
                    compressResult.outputPath ||
                      req.files[fieldName][i].path ||
                      req.files[fieldName][i].filename ||
                      ""
                  ).replace(/\\/g, "/");
                  req.files[fieldName][i].dbFileName = normalizedPath
                    .split("/")
                    .pop();
                } catch (e) {
                  console.error("خطأ أثناء تعيين dbFileName لملفات مختلطة:", e);
                }
                console.log(
                  `تم ضغط الملف ${fieldName}[${i}]: ${file.originalname}, الحجم الجديد: ${req.files[fieldName][i].size}`
                );
              }
            }
          }

          return resolve({
            compressed: true,
            mixedFiles: true,
            results: compressResults,
          });
        }

        // لم يتم رفع أي ملفات
        return resolve({ compressed: false, noFiles: true });
      } catch (error) {
        console.error("خطأ أثناء ضغط الملفات:", error);
        // نعيد النتيجة بدون ضغط في حالة حدوث خطأ
        return resolve({ compressed: false, error: error.message });
      }
    });
  });
};

/**
 * دالة رفع صورة واحدة مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصورة بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadSingleImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadSingleImage, compress);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع فيديو واحد مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الفيديو بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadSingleVideoWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadSingleVideo, compress);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع صور متعددة مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصور بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadMultipleImagesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadMultipleImages, compress);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع فيديوهات متعددة مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الفيديوهات بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadMultipleVideosWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadMultipleVideos, compress);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع ملفات مختلطة مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الملفات بعد الرفع؟
 * @returns {Promise} - وعد يحل عند اكتمال العملية
 */
const uploadMixedFilesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadMixedFiles, compress);
    // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = {};
    if (req.files && !Array.isArray(req.files)) {
      for (const fieldName in req.files) {
        map[fieldName] = req.files[fieldName].map(extract);
      }
    } else if (Array.isArray(req.files)) {
      map.files = req.files.map(extract);
    } else if (req.file) {
      map.file = [extract(req.file)];
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// ==================== دوال Multer المخصصة لكل نوع محتوى ====================

/**
 * إنشاء multer مخصص للفئات (Categories)
 */
const createCategoryUploader = () => {
  const categoryStorage = createCustomStorage("categories");
  return multer({
    storage: categoryStorage,
    fileFilter: fileFilter,
    limits: limits,
  });
};

/**
 * إنشاء multer مخصص للمنتجات (Products)
 */
const createProductUploader = () => {
  const productStorage = createCustomStorage("products");
  return multer({
    storage: productStorage,
    fileFilter: fileFilter,
    limits: limits,
  });
};

/**
 * إنشاء multer مخصص للمستخدمين (Users)
 */
const createUserUploader = () => {
  const userStorage = createCustomStorage("users");
  return multer({
    storage: userStorage,
    fileFilter: fileFilter,
    limits: limits,
  });
};

// دوال رفع مخصصة للفئات
const categoryUploader = createCategoryUploader();
const uploadCategoryImage = categoryUploader.single("image");
const uploadCategoryImages = categoryUploader.array("images", 10);
const uploadCategoryMixed = categoryUploader.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 10 },
]);

// دوال رفع مخصصة للمنتجات
const productUploader = createProductUploader();
const uploadProductImage = productUploader.single("image");
const uploadProductImages = productUploader.array("images", 20);
const uploadProductMixed = productUploader.fields([
  { name: "image", maxCount: 1 },
  { name: "images", maxCount: 20 },
]);

// دوال رفع مخصصة للمستخدمين
const userUploader = createUserUploader();
const uploadUserImage = userUploader.single("image");

// إنشاء multer مخصص للبوستات (Posts)
const createPostUploader = () => {
  const postStorage = createCustomStorage("posts");
  return multer({ storage: postStorage, fileFilter: fileFilter, limits });
};

const createEmergencyServiceUploader = () => {
  const postStorage = createCustomStorage("emergency-services");
  return multer({ storage: postStorage, fileFilter: fileFilter, limits });
};

// إنشاء multer مخصص للستوري (Stories)
const createStoryUploader = () => {
  const storyStorage = createCustomStorage("stories");
  return multer({ storage: storyStorage, fileFilter: fileFilter, limits });
};

// دوال رفع مخصصة للبوستات: صور متعددة + فيديو واحد اختياري
const postUploader = createPostUploader();
const uploadPostMixed = postUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);

// دوال رفع مخصصة للستوري: حتى 5 عناصر مختلطة (صور/فيديو)
// Limits for story media
const STORY_LIMITS = { MAX_IMAGES: 5, MAX_VIDEOS: 5, MAX_TOTAL: 5 };

const storyUploader = createStoryUploader();
const uploadStoryMixed = storyUploader.fields([
  { name: "images", maxCount: STORY_LIMITS.MAX_IMAGES },
  { name: "videos", maxCount: STORY_LIMITS.MAX_VIDEOS },
]);

const emergencyServiceUploader = createEmergencyServiceUploader();
const uploadEmergencyServiceMixed = emergencyServiceUploader.fields([
  { name: "images", maxCount: 1 },
  { name: "image", maxCount: 1 }
]);

const uploadPostMediaWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadPostMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], video: [] };
    if (req.files && req.files.images) {
      map.images = req.files.images.map(extract);
    }
    if (req.files && req.files.video) {
      map.video = req.files.video.map(extract); // 0..1
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع وسائط الستوري مع الضغط وبناء req.dbFiles
const uploadStoryMediaWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadStoryMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], videos: [] };
    if (req.files && req.files.images) {
      map.images = req.files.images.map(extract);
    }
    if (req.files && req.files.videos) {
      map.videos = req.files.videos.map(extract); // 0..1
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

const uploadEmergencyServiceMediaWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadEmergencyServiceMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [] };
    
    // Handle both "images" and "image" field names
    if (req.files && req.files.images) {
      map.images = req.files.images.map(extract);
    } else if (req.files && req.files.image) {
      map.images = req.files.image.map(extract);
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// إنشاء multer مخصص للمعارض (Exhibitions)
const createExhibitionsUploader = () => {
  const exhibitionsStorage = createCustomStorage("exhibitions");
  return multer({ storage: exhibitionsStorage, fileFilter: fileFilter, limits });
};

// إنشاء multer مخصص للمهرجانات والأحداث (FestivalsEvents)
const createFestivalsEventsUploader = () => {
  const festivalsEventsStorage = createCustomStorage("festivals_events");
  return multer({ storage: festivalsEventsStorage, fileFilter: fileFilter, limits });
};

// إنشاء multer مخصص لـ Explore
const createExploreUploader = () => {
  const exploreStorage = createCustomStorage("explore");
  return multer({ storage: exploreStorage, fileFilter: fileFilter, limits });
};

// إنشاء multer مخصص لـ eVisa
const createEVisaUploader = () => {
  const eVisaStorage = createCustomStorage("eVisa");
  return multer({ storage: eVisaStorage, fileFilter: fileFilter, limits });
};

// إنشاء multer مخصص لوسائل المواصلات العامة
const createPublicTransportUploader = () => {
  const publicTransportStorage = createCustomStorage("public_transport");
  return multer({ storage: publicTransportStorage, fileFilter: fileFilter, limits });
};
// دوال رفع مخصصة للكافتيريا
const createCafeteriaUploader = () => {
    const cafeteriaStorage = createCustomStorage('cafeterias');
    return multer({
        storage: cafeteriaStorage,
        fileFilter: fileFilter,
        limits: limits
    });
};
// دوال رفع مخصصة للفنون والثقافة
const createArtsCultureUploader = () => {
    const artsCultureStorage = createCustomStorage('arts_culture');
    return multer({
        storage: artsCultureStorage,
        fileFilter: fileFilter,
        limits: limits
    });
};
// دوال رفع مخصصة للمطاعم
const createRestaurantUploader = () => {
    const restaurantStorage = createCustomStorage('restaurants');
    return multer({
        storage: restaurantStorage,
        fileFilter: fileFilter,
        limits: limits
    });
};

// دوال رفع مخصصة للمعارض
const exhibitionsUploader = createExhibitionsUploader();
const uploadExhibitionsMixed = exhibitionsUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
  { name: "videos", maxCount: 5 }
]);

// دوال رفع مخصصة للمهرجانات والأحداث
const festivalsEventsUploader = createFestivalsEventsUploader();
const uploadFestivalsEventsMixed = festivalsEventsUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
  { name: "videos", maxCount: 5 }
]);

// دوال رفع مخصصة لـ Explore
const exploreUploader = createExploreUploader();
const uploadExploreMixed = exploreUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
  { name: "videos", maxCount: 5 }
]);

// دوال رفع مخصصة لـ eVisa
const eVisaUploader = createEVisaUploader();
const uploadEVisaMixed = eVisaUploader.fields([
  { name: "passportCopy", maxCount: 1 },
  { name: "personalPhoto", maxCount: 1 },
  { name: "hotelBooking", maxCount: 1 },
  { name: "travelInsurance", maxCount: 1 }
]);
const cafeteriaUploader = createCafeteriaUploader();
const uploadCafeteriaImage = cafeteriaUploader.single('image');
const uploadCafeteriaImages = cafeteriaUploader.array('images', 10);
const uploadCafeteriaMixed = cafeteriaUploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);
// دوال رفع مخصصة للفنون والثقافة
const artsCultureUploader = createArtsCultureUploader();
const uploadArtsCultureImage = artsCultureUploader.single('image');
const uploadArtsCultureImages = artsCultureUploader.array('images', 10);
const uploadArtsCultureMixed = artsCultureUploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

// دوال رفع مخصصة للعروض
const createOffersUploader = () => {
    const offersStorage = createCustomStorage('offers');
    return multer({
        storage: offersStorage,
        fileFilter: fileFilter,
        limits: limits
    });
};

const offersUploader = createOffersUploader();
const uploadOffersImage = offersUploader.single('image');
const uploadOffersImages = offersUploader.array('images', 10);
const uploadOffersMixed = offersUploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 },
    { name: 'photos', maxCount: 10 },
    { name: 'photo', maxCount: 1 },
    { name: 'videos', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]);
// دوال رفع مخصصة لوسائل المواصلات العامة
const publicTransportUploader = createPublicTransportUploader();
const uploadPublicTransportMixed = publicTransportUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 },
  { name: "videos", maxCount: 5 }
]);
const restaurantUploader = createRestaurantUploader();
const uploadRestaurantImage = restaurantUploader.single('image');
const uploadRestaurantImages = restaurantUploader.array('images', 10);
const uploadRestaurantMixed = restaurantUploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);
// دالة رفع وسائط المعارض مع الضغط وبناء req.dbFiles
const uploadExhibitionsImagesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadExhibitionsMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], image: [], videos: [] };
    
    if (req.files) {
      if (req.files.images) {
        map.images = req.files.images.map(extract);
      }
      if (req.files.image) {
        map.image = req.files.image.map(extract);
      }
      if (req.files.videos) {
        map.videos = req.files.videos.map(extract);
      }
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع وسائط Explore مع الضغط وبناء req.dbFiles
const uploadExploreImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadExploreMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], image: [], videos: [] };
    
    if (req.files) {
      if (req.files.images) {
        map.images = req.files.images.map(extract);
      }
      if (req.files.image) {
        map.image = req.files.image.map(extract);
      }
      if (req.files.videos) {
        map.videos = req.files.videos.map(extract);
      }
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع وسائط eVisa مع بناء req.dbFiles
const uploadEVisaFilesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadEVisaMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = {};
    
    // Process each eVisa file field
    if (req.files) {
      if (req.files.passportCopy) {
        map.passportCopy = req.files.passportCopy.map(extract);
      }
      if (req.files.personalPhoto) {
        map.personalPhoto = req.files.personalPhoto.map(extract);
      }
      if (req.files.hotelBooking) {
        map.hotelBooking = req.files.hotelBooking.map(extract);
      }
      if (req.files.travelInsurance) {
        map.travelInsurance = req.files.travelInsurance.map(extract);
      }
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع وسائط وسائل المواصلات العامة مع الضغط وبناء req.dbFiles
const uploadPublicTransportImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadPublicTransportMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], image: [], videos: [] };
    
    if (req.files) {
      if (req.files.images) {
        map.images = req.files.images.map(extract);
      }
      if (req.files.image) {
        map.image = req.files.image.map(extract);
      }
      if (req.files.videos) {
        map.videos = req.files.videos.map(extract);
      }
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع وسائط المهرجانات والأحداث مع الضغط وبناء req.dbFiles
const uploadFestivalsEventsImagesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadFestivalsEventsMixed, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], image: [], videos: [] };
    
    if (req.files) {
      if (req.files.images) {
        map.images = req.files.images.map(extract);
      }
      if (req.files.image) {
        map.image = req.files.image.map(extract);
      }
      if (req.files.videos) {
        map.videos = req.files.videos.map(extract);
      }
    }
    
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع صورة فئة مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصور بعد الرفع؟
 */
const uploadCategoryImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadCategoryMixed, compress);
    // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = {};
    if (req.files && !Array.isArray(req.files)) {
      for (const fieldName in req.files) {
        map[fieldName] = req.files[fieldName].map(extract);
      }
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع صور منتج مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصور بعد الرفع؟
 */
const uploadProductImagesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadProductMixed, compress);
    // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = {};
    if (req.files && !Array.isArray(req.files)) {
      for (const fieldName in req.files) {
        map[fieldName] = req.files[fieldName].map(extract);
      }
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * دالة رفع صورة مستخدم مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصور بعد الرفع؟
 */
const uploadUserImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadUserImage, compress);
    // Populate req.dbFiles.image to align with controllers expecting it
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = {};
    if (req.file) {
      map.image = [extract(req.file)];
    } else if (req.files && Array.isArray(req.files)) {
      map.image = req.files.map(extract);
    } else if (req.files && !Array.isArray(req.files) && req.files.image) {
      map.image = req.files.image.map(extract);
    }
    if (Object.keys(map).length > 0) {
      req.dbFiles = map;
    }
    next();
  } catch (error) {
    next(error);
  }
};

// دالة لإنشاء multer مخصص للمرشدين السياحيين (Tour Guides)
const createTourGuideUploader = () => {
  const tourGuideStorage = createCustomStorage("tourGuides");
  return multer({ storage: tourGuideStorage, fileFilter: fileFilter, limits });
};

// دالة لإنشاء multer مخصص للتجارب (Experiences)
const createExperienceUploader = () => {
  const experienceStorage = createCustomStorage("experiences");
  return multer({ storage: experienceStorage, fileFilter: fileFilter, limits });
};

// دوال رفع مخصصة للمرشدين السياحيين
const tourGuideUploader = createTourGuideUploader();
const uploadTourGuideImage = tourGuideUploader.single("image");

// دوال رفع مخصصة للتجارب
const experienceUploader = createExperienceUploader();
const uploadExperienceImages = experienceUploader.fields([
  { name: "images", maxCount: 10 },
  { name: "image", maxCount: 1 }
]);

// دالة رفع صورة المرشد السياحي مع الضغط وبناء req.dbFiles
const uploadTourGuideImageWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadTourGuideImage, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { image: [] };
    if (req.file) {
      map.image = [extract(req.file)];
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};

// دالة رفع صور التجربة مع الضغط وبناء req.dbFiles
const uploadExperienceImagesWithCompression = async (
  req,
  res,
  next,
  compress = true
) => {
  try {
    await uploadAndCompress(req, res, uploadExperienceImages, compress);
    const extract = (f) =>
      String(f?.dbFileName || f?.path || f?.filename || "")
        .replace(/\\/g, "/")
        .split("/")
        .pop();
    const map = { images: [], image: [] };
    if (req.files) {
      if (req.files.images) {
        map.images = req.files.images.map(extract);
      }
      if (req.files.image) {
        map.image = req.files.image.map(extract);
      }
    }
    req.dbFiles = map;
    next();
  } catch (error) {
    next(error);
  }
};
/**
 * دالة رفع صورة كافتيريا مع ضغط تلقائي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للمعالج التالي
 * @param {boolean} compress - هل يتم ضغط الصور بعد الرفع؟
 */
const uploadCafeteriaImagesWithCompression = async (req, res, next, compress = true) => {
    try {
        await uploadAndCompress(req, res, uploadCafeteriaMixed, compress);
        // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
        const extract = (f) => String(f?.dbFileName || f?.path || f?.filename || '')
            .replace(/\\/g, '/')
            .split('/')
            .pop();
        const map = {};
        if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
                map[fieldName] = req.files[fieldName].map(extract);
            }
        }
        req.dbFiles = map;
        next();
    } catch (error) {
        next(error);
    }
};
// دالة رفع وسائط الفنون والثقافة مع الضغط وبناء req.dbFiles
const uploadArtsCultureImageWithCompression = async (req, res, next, compress = true) => {
    try {
        await uploadAndCompress(req, res, uploadArtsCultureMixed, compress);
        // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
        const extract = (f) => String(f?.dbFileName || f?.path || f?.filename || '')
            .replace(/\\/g, '/')
            .split('/')
            .pop();
        const map = {};
        if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
                map[fieldName] = req.files[fieldName].map(extract);
            }
        }
        req.dbFiles = map;
        next();
    } catch (error) {
        next(error);
    }
};

// دالة رفع وسائط العروض مع الضغط وبناء req.dbFiles
const uploadOffersImagesWithCompression = async (req, res, next, compress = true) => {
    try {
        await uploadAndCompress(req, res, uploadOffersMixed, compress);
        // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
        const extract = (f) => String(f?.dbFileName || f?.path || f?.filename || '')
            .replace(/\\/g, '/')
            .split('/')
            .pop();
        const map = {};
        if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
                map[fieldName] = req.files[fieldName].map(extract);
            }
        }
        req.dbFiles = map;
        next();
    } catch (error) {
        next(error);
    }
};

const uploadRestaurantImagesWithCompression = async (req, res, next, compress = true) => {
    try {
        await uploadAndCompress(req, res, uploadRestaurantMixed, compress);
        // بناء قائمة أسماء الملفات النهائية للاستخدام في الكنترولر
        const extract = (f) => String(f?.dbFileName || f?.path || f?.filename || '')
            .replace(/\\/g, '/')
            .split('/')
            .pop();
        const map = {};
        if (req.files && !Array.isArray(req.files)) {
            for (const fieldName in req.files) {
                map[fieldName] = req.files[fieldName].map(extract);
            }
        }
        req.dbFiles = map;
        next();
    } catch (error) {
        next(error);
    }
};

// تنزيل صورة من URL وتخزينها في uploads مع خيار الضغط
//google + facebook
async function downloadImageFromUrlToUploads(imageUrl, options = {}) {
  try {
    if (!imageUrl || typeof imageUrl !== "string") return null;
    if (!/^https?:\/\//i.test(imageUrl)) return null;

    const {
      contentType = "users", // مجلد المحتوى: users | products | categories ...
      fileNamePrefix = "user_",
      subfolder = "images", // images | videos
      compress = true, // ضغط الصورة بعد التنزيل
    } = options;

    const uploadDirRelative = getUploadPath(contentType, subfolder); // مثال: public/uploads/images/users/
    const uploadDir = path.resolve(uploadDirRelative);

    // تأكد من وجود المجلد
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // استخرج الامتداد من URL
    const cleanUrl = imageUrl.split("?")[0];
    const extMatch = cleanUrl.match(/\.([a-zA-Z0-9]+)$/);
    const ext = (extMatch ? extMatch[1] : "jpg").toLowerCase();

    const fileName = `${fileNamePrefix}${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;

    const finalPath = path.join(uploadDir, fileName);
    const tmpPath = path.join(uploadDir, `tmp_${fileName}`);

    // تنزيل الصورة
    const resp = await fetch(imageUrl);
    if (!resp.ok) throw new Error(`Failed to fetch image: ${resp.status}`);
    const arrayBuffer = await resp.arrayBuffer();
    fs.writeFileSync(tmpPath, Buffer.from(arrayBuffer));

    // ضغط اختياري
    if (compress) {
      await compressImage(tmpPath, finalPath, ext);
    } else {
      fs.renameSync(tmpPath, finalPath);
    }

    // أعد المسار النسبي المخزن في قاعدة البيانات
    return `uploads/${subfolder}/${contentType}/${fileName}`;
  } catch (e) {
    console.warn("downloadImageFromUrlToUploads error:", e.message);
    return null;
  }
}

// تصدير الدوال والوظائف للاستخدام في الملفات الأخرى
module.exports = {
  // دوال رفع الملفات
  uploadSingleImage,
  uploadSingleVideo,
  uploadMultipleImages,
  uploadMultipleVideos,
  uploadMixedFiles,

  // دوال رفع الملفات مع الضغط التلقائي
  uploadSingleImageWithCompression,
  uploadSingleVideoWithCompression,
  uploadMultipleImagesWithCompression,
  uploadMultipleVideosWithCompression,
  uploadMixedFilesWithCompression,

  // دوال رفع مخصصة للفئات
  uploadCategoryImage,
  uploadCategoryImages,
  uploadCategoryMixed,
  uploadCategoryImageWithCompression,

  // دوال رفع مخصصة للمنتجات
  uploadProductImage,
  uploadProductImages,
  uploadProductMixed,
  uploadProductImagesWithCompression,

  // دوال رفع مخصصة للمستخدمين
  uploadUserImage,
  uploadUserImageWithCompression,

  // دوال رفع مخصصة للمرشدين السياحيين
  uploadTourGuideImage,
  uploadTourGuideImageWithCompression,

  // دوال رفع مخصصة للتجارب
  uploadExperienceImages,
  uploadExperienceImagesWithCompression,

  // دوال رفع مخصصة للبوستات والستوري
  uploadPostMediaWithCompression,
  uploadStoryMediaWithCompression,
  uploadEmergencyServiceMediaWithCompression,

  // دوال رفع مخصصة للمعارض
  uploadExhibitionsMixed,
  uploadExhibitionsImagesWithCompression,

  uploadExploreMixed,
  uploadExploreImageWithCompression,
  uploadPublicTransportMixed,
  uploadPublicTransportImageWithCompression,

  // دوال رفع مخصصة للمهرجانات والأحداث
  uploadFestivalsEventsMixed,
  uploadFestivalsEventsImagesWithCompression,
  // دوال رفع مخصصة للمطاعم
  uploadRestaurantImage,
  uploadRestaurantImages,
  uploadRestaurantMixed,
  uploadRestaurantImagesWithCompression,

  // دوال رفع مخصصة للكافتيريا
  uploadCafeteriaImage,
  uploadCafeteriaImages,
  uploadCafeteriaMixed,
  uploadCafeteriaImagesWithCompression,

  // دوال رفع مخصصة للفنون والثقافة
  uploadArtsCultureImage,
  uploadArtsCultureImages,
  uploadArtsCultureMixed,
  uploadArtsCultureImageWithCompression,
  
  // دوال رفع مخصصة للعروض
  uploadOffersImage,
  uploadOffersImages,
  uploadOffersMixed,
  uploadOffersImagesWithCompression,

  // دوال رفع مخصصة لـ eVisa
  uploadEVisaMixed,
  uploadEVisaFilesWithCompression,

  // دوال إنشاء uploaders مخصصة
  createCategoryUploader,
  createProductUploader,
  createUserUploader,
  createPostUploader,
  createStoryUploader,
  createCustomStorage,
  getUploadPath,
  createTourGuideUploader,
  createExperienceUploader,
  createEVisaUploader,
  // دوال إنشاء uploaders مخصصة للفنون والثقافة
  createArtsCultureUploader,
  
  // دوال إنشاء uploaders مخصصة للعروض
  createOffersUploader,

  // دوال الضغط
  compressImage,
  compressVideo,
  compressFile,
  checkFFmpegAvailability,

  // تنزيل الصورة من URL
  downloadImageFromUrlToUploads,

  // دوال مساعدة
  handleUploadError,
  createSuccessResponse,
  createMultipleSuccessResponse,

  // دوال حذف الملفات (بدون قاعدة البيانات)
  deleteFile,
  deleteFileFromUrl,
  deleteMultipleFiles,
  deleteImage,
  deleteVideo,
  deleteMultipleImages,
  deleteMultipleVideos,
  deleteFileByPath,
  deleteAllImages,
  deleteAllVideos,

  // ثوابت
  ALLOWED_EXTENSIONS,
  IMAGE_COMPRESSION_SETTINGS,
  VIDEO_COMPRESSION_SETTINGS,
  limits,
};
