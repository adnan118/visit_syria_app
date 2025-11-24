/*
مهاجر لإزالة عمود cityId من جدول وسائل المواصلات العامة (public_transport)
------------------------------------------------------------------
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Remove the cityId column from public_transport table
    await queryInterface.removeColumn('public_transport', 'cityId');
  },

  down: async (queryInterface, Sequelize) => {
    // Add the cityId column back if needed
    await queryInterface.addColumn('public_transport', 'cityId', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'cities',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  }
};