/*
 * Database Migration: Create Users Table
 * 
 * This migration script creates the users table for storing user information.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      firstName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      lastName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      username: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      mobile: {
        type: Sequelize.STRING,
        allowNull: false
      },
      passwordHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      bio: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      provider: {
        type: Sequelize.ENUM('local', 'google', 'facebook'),
        defaultValue: 'local'
      },
      googleId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      facebookId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      firebaseUid: {
        type: Sequelize.STRING,
        allowNull: true
      },
      emailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isAdmin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      isDeactivated: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      deactivatedUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resetPasswordOtp: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      resetPasswordOtpExpires: {
        type: Sequelize.DATE,
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
    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['username']);
    await queryInterface.addIndex('users', ['googleId']);
    await queryInterface.addIndex('users', ['facebookId']);
    await queryInterface.addIndex('users', ['firebaseUid']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};