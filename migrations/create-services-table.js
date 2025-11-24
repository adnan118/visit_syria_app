/*
 * Database Migration: Create Services Table
 * 
 * This migration script creates the services table for storing services.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      nameAr: {
        type: Sequelize.STRING,
        allowNull: false
      },
      nameEn: {
        type: Sequelize.STRING,
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      icon: {
        type: Sequelize.STRING,
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
    await queryInterface.addIndex('services', ['slug'], { unique: true });
    await queryInterface.addIndex('services', ['nameAr']);
    await queryInterface.addIndex('services', ['nameEn']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('services');
  }
};