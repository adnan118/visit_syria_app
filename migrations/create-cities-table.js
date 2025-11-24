/*
 * Database Migration: Create Cities Table
 * 
 * This migration script creates the cities table for storing city information.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create cities table
    await queryInterface.createTable('cities', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name_ar: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      name_en: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
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
    await queryInterface.addIndex('cities', ['name_ar']);
    await queryInterface.addIndex('cities', ['name_en']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop cities table
    await queryInterface.dropTable('cities');
  }
};