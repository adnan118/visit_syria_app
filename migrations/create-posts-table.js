/*
 * Database Migration: Create Posts Table
 * 
 * This migration script creates the posts table for storing user posts.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('posts', {
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
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      media: {
        type: Sequelize.JSON,
        allowNull: true
      },
      likesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      commentsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      sharesCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      viewsCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isDeleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      rejectionReason: {
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
    await queryInterface.addIndex('posts', ['userId']);
    await queryInterface.addIndex('posts', ['createdAt']);
    await queryInterface.addIndex('posts', ['status']);
    await queryInterface.addIndex('posts', ['likesCount']);
    await queryInterface.addIndex('posts', ['commentsCount']);
    await queryInterface.addIndex('posts', ['sharesCount']);
    await queryInterface.addIndex('posts', ['viewsCount']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('posts');
  }
};
