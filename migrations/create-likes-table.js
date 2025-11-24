/*
 * Database Migration: Create Likes Table
 * 
 * This migration script creates the likes table for storing post likes.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('likes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      postId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'posts',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
      }
    });

    // Add unique composite index
    await queryInterface.addIndex('likes', ['postId', 'userId'], { unique: true });
    
    // Add indexes for better performance
    await queryInterface.addIndex('likes', ['postId']);
    await queryInterface.addIndex('likes', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('likes');
  }
};