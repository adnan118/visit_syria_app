/*
Migration to update establishmentType enum values in offers table and remove establishmentId column
--------------------------------------------------------------------------------------------------
- Updates establishmentType enum to include tourism-related values
- Removes establishmentId column which is no longer needed
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove establishmentId column if it exists
      await queryInterface.removeColumn('offers', 'establishmentId');
    } catch (error) {
      console.log('Column establishmentId might not exist:', error.message);
    }

    try {
      // Update establishmentType enum values
      await queryInterface.changeColumn('offers', 'establishmentType', {
        type: Sequelize.ENUM(
          'Restaurant',
          'Cafeteria',
          'Hotel',
          'Tourist Attraction',
          'Museum',
          'Historical Site',
          'Beach Resort',
          'Mountain Resort',
          'Cultural Center',
          'Shopping Mall',
          'Park',
          'Zoo',
          'Amusement Park',
          'Spa & Wellness',
          
          'Nightclub',
          
          'Cafe',
          'Fast Food',
          'Fine Dining',
          'Local Cuisine',
          'Street Food',
          'Other'
        ),
        allowNull: false
      });
    } catch (error) {
      console.log('Error updating establishmentType enum:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Revert establishmentType enum to original values
      await queryInterface.changeColumn('offers', 'establishmentType', {
        type: Sequelize.ENUM(
          'Restaurant',
          'Cafeteria',
          'Other'
        ),
        allowNull: false
      });

      // Add back establishmentId column
      await queryInterface.addColumn('offers', 'establishmentId', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    } catch (error) {
      console.log('Error reverting migration:', error.message);
    }
  }
};
