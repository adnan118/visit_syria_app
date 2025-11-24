/*
 * Database Migration: Create User Interests Table
 * 
 * This migration script creates the user_interests table for many-to-many relationship
 * between users and tags (user interests).
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create user_interests table
    await queryInterface.createTable('user_interests', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      tagId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tags',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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

    // Add unique composite index with error handling
    try {
      await queryInterface.addIndex('user_interests', ['userId', 'tagId'], {
        unique: true,
        name: 'user_interests_user_id_tag_id'
      });
    } catch (error) {
      console.log('Index user_interests_user_id_tag_id already exists or failed to create');
    }

    // Add individual indexes with error handling
    try {
      await queryInterface.addIndex('user_interests', ['userId'], {
        name: 'user_interests_user_id'
      });
    } catch (error) {
      console.log('Index user_interests_user_id already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('user_interests', ['tagId'], {
        name: 'user_interests_tag_id'
      });
    } catch (error) {
      console.log('Index user_interests_tag_id already exists or failed to create');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes before dropping table
    try {
      await queryInterface.removeIndex('user_interests', 'user_interests_user_id_tag_id');
    } catch (error) {
      console.log('Index user_interests_user_id_tag_id does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('user_interests', 'user_interests_user_id');
    } catch (error) {
      console.log('Index user_interests_user_id does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('user_interests', 'user_interests_tag_id');
    } catch (error) {
      console.log('Index user_interests_tag_id does not exist or failed to remove');
    }
    
    // Drop user_interests table
    await queryInterface.dropTable('user_interests');
  }
};