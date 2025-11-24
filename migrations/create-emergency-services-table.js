/*
 * Migration: Create Emergency Services Table
 * Description: Creates the emergency_services table in the database
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('emergency_services', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      titleAr: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'العنوان بالعربية'
      },
      titleEn: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'Title in English'
      },
      phoneNumber: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'رقم الهاتف'
      },
      image: {
        type: Sequelize.STRING,
        allowNull: true,
        comment: 'رابط الصورة'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Add indexes
    await queryInterface.addIndex('emergency_services', ['titleAr']);
    await queryInterface.addIndex('emergency_services', ['titleEn']);
    await queryInterface.addIndex('emergency_services', ['phoneNumber']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('emergency_services');
  }
};