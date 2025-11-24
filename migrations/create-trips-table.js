/*
 * Database Migration: Create Trips Table
 * 
 * This migration script creates the trips table for storing user trips.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('trips', {
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
      name: {
        type: Sequelize.STRING,
        allowNull: false
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

    // Add indexes for better performance
    try {
      await queryInterface.addIndex('trips', ['userId', 'name', 'itemType', 'itemId'], {
        unique: true,
        name: 'trips_user_name_item_unique'
      });
    } catch (error) {
      console.log('Index trips_user_name_item_unique already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('trips', ['userId'], {
        name: 'trips_user_id_index'
      });
    } catch (error) {
      console.log('Index trips_user_id_index already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('trips', ['name'], {
        name: 'trips_name_index'
      });
    } catch (error) {
      console.log('Index trips_name_index already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('trips', ['itemType', 'itemId'], {
        name: 'trips_item_type_id_index'
      });
    } catch (error) {
      console.log('Index trips_item_type_id_index already exists or failed to create');
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeIndex('trips', 'trips_user_name_item_unique');
    } catch (error) {
      console.log('Index trips_user_name_item_unique does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('trips', 'trips_user_id_index');
    } catch (error) {
      console.log('Index trips_user_id_index does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('trips', 'trips_name_index');
    } catch (error) {
      console.log('Index trips_name_index does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('trips', 'trips_item_type_id_index');
    } catch (error) {
      console.log('Index trips_item_type_id_index does not exist or failed to remove');
    }
    
    await queryInterface.dropTable('trips');
  }
};