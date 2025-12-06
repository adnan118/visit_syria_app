/*
Migration to add cityId column to offers table and remove cityName columns
-----------------------------------------------------------------------
- Adds cityId column as foreign key to cities table
- Removes cityName_ar and cityName_en columns which are no longer needed
- Adds index on cityId for better performance
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Remove old cityName columns if they exist
      await queryInterface.removeColumn('offers', 'cityName_ar');
      await queryInterface.removeColumn('offers', 'cityName_en');
    } catch (error) {
      console.log('Columns cityName_ar or cityName_en might not exist:', error.message);
    }

    try {
      // Add cityId column
      await queryInterface.addColumn('offers', 'cityId', {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cities',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      });

      // Add index on cityId
      await queryInterface.addIndex('offers', ['cityId']);
    } catch (error) {
      console.log('Error adding cityId column or index:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove cityId column
      await queryInterface.removeColumn('offers', 'cityId');
      
      // Add back old cityName columns
      await queryInterface.addColumn('offers', 'cityName_ar', {
        type: Sequelize.STRING,
        allowNull: false
      });
      
      await queryInterface.addColumn('offers', 'cityName_en', {
        type: Sequelize.STRING,
        allowNull: false
      });

      // Add back old indexes
      await queryInterface.addIndex('offers', ['cityName_ar']);
      await queryInterface.addIndex('offers', ['cityName_en']);
    } catch (error) {
      console.log('Error reverting migration:', error.message);
    }
  }
};
