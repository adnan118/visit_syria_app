/*
Feedback Table Migration (create-feedback-table.js)
--------------------------------------
Purpose:
- Creates the feedback table in the database
- Defines all required fields with appropriate data types and constraints
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('feedback', {
      // Unique identifier for each record
      id: {
        type: Sequelize.INTEGER,           // Field type: Integer
        primaryKey: true,                // Primary key
        autoIncrement: true,             // Auto-incrementing
        allowNull: false                 // Not nullable
      },
      // First Name
      firstName: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'User first name'      // Field description
      },
      // Last Name
      lastName: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'User last name'       // Field description
      },
      // Email
      email: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        validate: {
          isEmail: true                 // Email validation
        },
        comment: 'User email address'   // Field description
      },
      // Country
      country: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'User country'         // Field description
      },
      // Feedback content
      feedback: {
        type: Sequelize.TEXT,            // Field type: Text
        allowNull: false,               // Required field
        comment: 'User feedback content' // Field description
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

    console.log('✅ Successfully created feedback table');
  },

  async down (queryInterface, Sequelize) {
    // Drop the feedback table
    await queryInterface.dropTable('feedback');
    console.log('✅ Successfully dropped feedback table');
  }
};