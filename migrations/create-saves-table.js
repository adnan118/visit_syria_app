/*
 * Database Migration: Create Saves Table
 * 
 * This migration script creates the saves table for storing post saves.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saves', {
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
    await queryInterface.addIndex('saves', ['postId', 'userId'], { unique: true });
    
    // Add indexes for better performance
    await queryInterface.addIndex('saves', ['postId']);
    await queryInterface.addIndex('saves', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saves');
  }
};