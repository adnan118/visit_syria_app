/*
  Migration to create the public_transport table
  This migration creates the table structure for storing public transportation information
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('public_transport', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      name_ar: {
        type: Sequelize.STRING,
        allowNull: false
      },
      name_en: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description_ar: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description_en: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      images: {
        type: Sequelize.JSON,
        allowNull: false,
        defaultValue: []
      },
      paymentMethods: {
        type: Sequelize.ENUM(
          'Prepaid_Transport_Cards',
          'Mobile_Payment_Apps',
          'Apple_Google_Pay',
          'Subscription_Cards',
          'Electronic_Tickets'
        ),
        allowNull: false,
        defaultValue: 'Prepaid_Transport_Cards'
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
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('public_transport');
  }
};
