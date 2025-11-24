/*
 * Database Migration: Create Tokens Table
 * 
 * This migration script creates the tokens table for storing user tokens.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('tokens', {
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
      firstName: {
        type: Sequelize.STRING,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        allowNull: true
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: true
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      refreshToken: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      accessToken: {
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
    await queryInterface.addIndex('tokens', ['userId']);
    await queryInterface.addIndex('tokens', ['accessToken']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tokens');
  }
};