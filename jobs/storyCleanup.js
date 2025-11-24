/**
 * ملف مهام التنظيف للستوري (storyCleanup.js)
 * -----------------------------------------------
 * يحتوي على cron job لحذف الستوري المنتهية الصلاحية والملفات المرتبطة بها.
 */

const cron = require("node-cron"); // استيراد node-cron للمهام المجدولة
const fs = require("fs"); // استيراد fs لحذف الملفات
const path = require("path"); // استيراد path للتعامل مع المسارات
const { Story } = require("../models"); // استيراد نموذج Story
const sequelize = require("../models/sequelize"); // استيراد sequelize

/**
 * دالة بدء مهام التنظيف
 * @param {string} __dirname - مسار الدليل الجذر للتطبيق
 */

const startStoryCleanupJobs = (__dirname) => {
  // إعداد cron job لحذف الستوري المنتهية الصلاحية كل ساعة
  cron.schedule("0 3 * * 5", async () => {
    console.log(
      "Running weekly cron job to delete expired stories every Friday at 03:00"
    );

    console.log("Running cron job to delete expired stories...");
    try {
      // التحقق من حالة الاتصال بقاعدة البيانات
      const dbState = sequelize.connectionManager.connections.size > 0;

      // إذا كانت قاعدة البيانات غير متصلة، تخطي المهمة
      if (!dbState) {
        console.log("Database not connected. Skipping cron job.");
        return;
      }

      const expiredStories = await Story.findAll({
        where: {
          expiresAt: { [sequelize.Op.lt]: new Date() },
        },
      });

      if (expiredStories.length === 0) {
        console.log("No expired stories found. Cron job completed.");
        return;
      }

      console.log(`Found ${expiredStories.length} expired stories to delete.`);

      for (const story of expiredStories) {
        // حذف الملفات المرتبطة بالستوري
        if (story.media) {
          try {
            const media = JSON.parse(story.media);
            if (Array.isArray(media)) {
              for (const mediaItem of media) {
                if (mediaItem.file) {
                  // تحديد نوع الملف ومسار المجلد
                  const fileType = mediaItem.type === "image" ? "images" : "videos";
                  const fullPath = path.join(
                    __dirname,
                    "public",
                    "uploads",
                    fileType,
                    "stories",
                    mediaItem.file
                  );
                  try {
                    if (fs.existsSync(fullPath)) {
                      fs.unlinkSync(fullPath);
                      console.log(`Deleted file: ${fullPath}`);
                    }
                  } catch (err) {
                    console.error(`Error deleting file ${fullPath}:`, err.message);
                  }
                }
              }
            }
          } catch (parseError) {
            console.error("Error parsing media JSON:", parseError.message);
          }
        }
        // حذف الستوري من قاعدة البيانات
        await story.destroy();
        console.log(`Deleted expired story: ${story.id}`);
      }
      console.log(
        `Cron job completed. Deleted ${expiredStories.length} expired stories.`
      );
    } catch (error) {
      // التعامل مع أخطاء الاتصال بقاعدة البيانات بشكل خاص
      if (error.name === "ConnectionError") {
        console.error(
          "Database connection error in cron job. Will retry in next cycle:",
          error.message
        );
      } else if (error.name === "SequelizeValidationError") {
        console.error("Validation error in cron job:", error.message);
      } else {
        console.error("Unexpected error in cron job:", error.message);
      }
    }
  });
};

module.exports = {
  startStoryCleanupJobs,
};


 