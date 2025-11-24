/*
Owner Contact Table Migration (create-owner-contact-table.js)
-----------------------------------------
Purpose:
- Creates the owner_contact table in the database
- Defines all required fields with appropriate data types and constraints
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('owner_contact', {
      // Unique identifier for each record
      id: {
        type: Sequelize.INTEGER,           // Field type: Integer
        primaryKey: true,                // Primary key
        autoIncrement: true,             // Auto-incrementing
        allowNull: false                 // Not nullable
      },
      // Address in Arabic
      address_ar: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Address in Arabic'    // Field description
      },
      // Address in English
      address_en: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Address in English'   // Field description
      },
      // Call number
      callNumber: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Contact phone number' // Field description
      },
      // Email
      email: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        validate: {
          isEmail: true                 // Email validation
        },
        comment: 'Contact email address' // Field description
      },
      // Chat number
      chatNumber: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Chat contact number'  // Field description
      },
      // Social media links as JSON array
      socialMediaLinks: {
        type: Sequelize.JSON,            // Field type: JSON
        allowNull: true,                // Optional field
        defaultValue: [],               // Default value: Empty array
        comment: 'List of social media links' // Field description
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

    console.log('✅ Successfully created owner_contact table');
  },

  async down (queryInterface, Sequelize) {
    // Drop the owner_contact table
    await queryInterface.dropTable('owner_contact');
    console.log('✅ Successfully dropped owner_contact table');
  }
};