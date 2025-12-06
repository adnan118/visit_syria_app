/*
ملف هجرة إنشاء جدول الفنون والثقافة (create-arts-culture-table.js)
--------------------------------------------------
وظيفة الملف:
- يُنشئ جدول "arts_culture" في قاعدة البيانات
- يحتوي على جميع الأعمدة المطلوبة لجدول الفنون والثقافة

المكتبات المستخدمة:
- Sequelize: لمكتبة ORM
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('arts_culture', {
      // المعرف الفريد لكل سجل
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },

      // الاسم بالعربية
      name_ar: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      // الاسم بالإنجليزية
      name_en: {
        type: Sequelize.STRING(255),
        allowNull: false
      },

      // الوصف بالعربية
      description_ar: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      // الوصف بالإنجليزية
      description_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },

      // صورة (رابط الصورة)
      image: {
        type: Sequelize.STRING(255),
        allowNull: true
      },

      // نقطة الطول (Latitude)
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },

      // نقطة العرض (Longitude)
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },

      // تاريخ الإنشاء
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },

      // تاريخ آخر تحديث
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('arts_culture');
  }
};
