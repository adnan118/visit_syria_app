/*
مهاجر إنشاء جدول المعارض (create-exhibitions-table.js)
--------------------------------------------
- إنشاء جدول المعارض في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمعارض
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('exhibitions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      place_ar: {
        type: Sequelize.STRING,
        allowNull: false
      },
      place_en: {
        type: Sequelize.STRING,
        allowNull: false
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      dateTime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      description_ar: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      media: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      official_supporter_ar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      official_supporter_en: {
        type: Sequelize.STRING,
        allowNull: true
      },
      duration_ar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      duration_en: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      target_audience_ar: {
        type: Sequelize.STRING,
        allowNull: true
      },
      target_audience_en: {
        type: Sequelize.STRING,
        allowNull: true
      },
      notes_ar: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      notes_en: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('exhibitions');
  }
};