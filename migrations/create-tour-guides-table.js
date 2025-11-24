/*
 * Database Migration: Create Tour Guides Table
 * 
 * This migration script creates the tour_guides table for storing tour guide information.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create tour_guides table
    await queryInterface.createTable('tour_guides', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        }
      },
      phone: {
        type: Sequelize.STRING,
        allowNull: false
      },
      socialMedia: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('tour_guides', ['cityId']);
    await queryInterface.addIndex('tour_guides', ['name']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop tour_guides table
    await queryInterface.dropTable('tour_guides');
  }
};