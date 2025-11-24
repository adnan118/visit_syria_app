/*
 * Migration: Remove Foreign Keys from Favorites Table
 * 
 * This migration removes the foreign key constraints from the favorites table
 * that were causing issues with MySQL.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove foreign key constraint for exhibitions
      await queryInterface.removeConstraint('favorites', 'favorites_exhibitions_fk');
    } catch (error) {
      console.log('Foreign key constraint for exhibitions does not exist or failed to remove');
    }
    
    try {
      // Remove foreign key constraint for festivals_events
      await queryInterface.removeConstraint('favorites', 'favorites_festivals_events_fk');
    } catch (error) {
      console.log('Foreign key constraint for festivals_events does not exist or failed to remove');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // We don't need to add the constraints back in the down migration
    // as they were problematic
    console.log('No action needed for down migration');
  }
};