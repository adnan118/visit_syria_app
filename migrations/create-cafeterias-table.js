'use strict';

// Migration to create cafeterias table
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('cafeterias', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      city_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      name_ar: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name_en: {
        type: Sequelize.STRING(255),
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
      cafeteria_type: {
        type: Sequelize.ENUM(
          'Popular',
          'Luxury',
          'Terraces',
          'Cafe',
          'Entertainment Tent'
        ),
        allowNull: false
      },
      opening_hours: {
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
      working_days: {
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
      images: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      phone_numbers: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      social_links: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('cafeterias');
  }
};
