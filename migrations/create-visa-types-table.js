/*
Visa Types Table Migration (create-visa-types-table.js)
--------------------------------------
Purpose:
- Creates the visa_types table in the database
- Defines all required fields with appropriate data types and constraints
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('visa_types', {
      // Unique identifier for each record
      id: {
        type: Sequelize.INTEGER,           // Field type: Integer
        primaryKey: true,                // Primary key
        autoIncrement: true,             // Auto-incrementing
        allowNull: false                 // Not nullable
      },
      // Purpose of visit in English
      purpose_of_visit_en: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Purpose of visit in English'
      },
      // Purpose of visit in Arabic
      purpose_of_visit_ar: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Purpose of visit in Arabic'
      },
      // Fee amount
      fee_amount: {
        type: Sequelize.DECIMAL(10, 2),   // Field type: Decimal with 10 digits and 2 decimal places
        allowNull: false,               // Required field
        comment: 'Visa fee amount'      // Field description
      },
      // Creation timestamp
      createdAt: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        defaultValue: Sequelize.NOW     // Default value: Current timestamp
      },
      // Last update timestamp
      updatedAt: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        defaultValue: Sequelize.NOW     // Default value: Current timestamp
      }
    });

    console.log('✅ Successfully created visa_types table');
  },

  async down (queryInterface, Sequelize) {
    // Drop the visa_types table
    await queryInterface.dropTable('visa_types');
    console.log('✅ Successfully dropped visa_types table');
  }
};