/*
 * Database Migration: Create Tags Table
 * 
 * This migration script creates the tags table for storing tags.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tags', {
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
    await queryInterface.addIndex('tags', ['slug'], { unique: true });
    await queryInterface.addIndex('tags', ['nameAr']);
    await queryInterface.addIndex('tags', ['nameEn']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tags');
  }
};