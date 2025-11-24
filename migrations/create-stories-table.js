/*
 * Database Migration: Create Stories Table
 * 
 * This migration script creates the stories table for storing user stories.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('stories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      caption: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      location: {
        type: Sequelize.STRING,
        allowNull: true
      },
      media: {
        type: Sequelize.JSON,
        allowNull: true
      },
      tags: {
        type: Sequelize.JSON,
        allowNull: true
      },
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      views: {
        type: Sequelize.JSON,
        allowNull: true
      },
      viewCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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
    await queryInterface.addIndex('stories', ['userId']);
    await queryInterface.addIndex('stories', ['expiresAt']);
    await queryInterface.addIndex('stories', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('stories');
  }
};