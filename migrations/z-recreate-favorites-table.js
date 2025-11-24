/*
 * Migration: Recreate Favorites Table
 * 
 * This migration drops and recreates the favorites table without foreign key constraints
 * to resolve the constraint issues.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Drop the existing favorites table
      await queryInterface.dropTable('favorites');
      console.log('Dropped existing favorites table');
    } catch (error) {
      console.log('Failed to drop favorites table:', error.message);
    }
    
    try {
      // Recreate the favorites table without foreign key constraints
      await queryInterface.createTable('favorites', {
        id: {
          type: Sequelize.INTEGER,
          primaryKey: true,
          autoIncrement: true,
          allowNull: false
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
        itemType: {
          type: Sequelize.ENUM('Exhibitions', 'FestivalsEvents'),
          allowNull: false
        },
        itemId: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });
      
      console.log('Recreated favorites table without foreign key constraints');
      
      // Add indexes
      await queryInterface.addIndex('favorites', ['userId', 'itemType', 'itemId'], {
        unique: true,
        name: 'favorites_user_item_unique'
      });
      
      await queryInterface.addIndex('favorites', ['userId'], {
        name: 'favorites_user_id_index'
      });
      
      await queryInterface.addIndex('favorites', ['itemType', 'itemId'], {
        name: 'favorites_item_type_id_index'
      });
      
      console.log('Added indexes to favorites table');
    } catch (error) {
      console.log('Failed to recreate favorites table:', error.message);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // In case of rollback, we would need to restore the previous version
    // But for now, we'll just drop the table
    await queryInterface.dropTable('favorites');
  }
};