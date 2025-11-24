/*
 * Database Migration: Create Experiences Table
 * 
 * This migration script creates the experiences table for storing tour guide experiences.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create experiences table
    await queryInterface.createTable('experiences', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tourGuideId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tour_guides',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      images: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
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
    await queryInterface.addIndex('experiences', ['tourGuideId']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop experiences table
    await queryInterface.dropTable('experiences');
  }
};