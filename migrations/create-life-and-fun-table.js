'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('explore', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name_ar: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name_en: {
        type: Sequelize.STRING,
        allowNull: false
      },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      description_ar: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      images: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      socialLinks: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      phoneNumbers: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      openingHours: {
        type: Sequelize.ENUM(
          '24/7',
          '08:00-16:00',
          '09:00-17:00',
          '10:00-22:00',
          '12:00-24:00',
          '16:00-02:00'
        ),
        allowNull: false,
        defaultValue: '09:00-17:00'
      },
      workingDays: {
        type: Sequelize.ENUM(
          'All Week',
          'Sunday to Thursday',
          'Saturday to Wednesday',
          'Monday to Friday',
          'Custom Days'
        ),
        allowNull: false,
        defaultValue: 'All Week'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('explore');
  }
};