/*
 * Database Migration: Create Offers Table
 * 
 * This migration script creates the offers table for storing discount offers.
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create offers table
    await queryInterface.createTable('offers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      cityId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      establishmentName_ar: {
        type: Sequelize.STRING,
        allowNull: false
      },
      establishmentName_en: {
        type: Sequelize.STRING,
        allowNull: false
      },
      offerName_ar: {
        type: Sequelize.STRING,
        allowNull: false
      },
      offerName_en: {
        type: Sequelize.STRING,
        allowNull: false
      },
      discountValue: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        validate: {
          min: 0,
          max: 100
        }
      },
      priceBefore: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      priceAfter: {
        type: Sequelize.DECIMAL(10, 2),
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
        allowNull: true,
        defaultValue: []
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: true
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: true
      },
      establishmentId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      establishmentType: {
        type: Sequelize.ENUM(
          'Restaurant',
          'Cafeteria',
          'Other'
        ),
        allowNull: false
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
    await queryInterface.addIndex('offers', ['cityId']);
    await queryInterface.addIndex('offers', ['establishmentType']);
    await queryInterface.addIndex('offers', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    // Drop offers table
    await queryInterface.dropTable('offers');
  }
};
