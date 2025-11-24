/*
E-Visa Applications Table Migration (create-e-visa-applications-table.js)
--------------------------------------
Purpose:
- Creates the e_visa_applications table in the database
- Defines all required fields with appropriate data types and constraints
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('e_visa_applications', {
      // Unique identifier for each record
      id: {
        type: Sequelize.INTEGER,           // Field type: Integer
        primaryKey: true,                // Primary key
        autoIncrement: true,             // Auto-incrementing
        allowNull: false                 // Not nullable
      },
      // User ID (foreign key to users table)
      userId: {
        type: Sequelize.STRING,          // Field type: String (MongoDB ObjectId)
        allowNull: false,               // Required field
        comment: 'User ID (foreign key to users table)'
      },
      // Full name
      full_name: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Full name of the applicant'
      },
      // Gender with Arabic and English translations
      gender: {
        type: Sequelize.ENUM(            // Field type: Enum with specific values
          'Male',
          'Female'
        ),
        allowNull: false,               // Required field
        comment: 'Gender (Male, Female)'
      },
      // Date of birth
      date_of_birth: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        comment: 'Date of birth'
      },
      // Nationality
      nationality: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Nationality'
      },
      // Passport number
      passport_number: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Passport number'
      },
      // Passport expiry date
      passport_expiry: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        comment: 'Passport expiry date'
      },
      // Email
      email: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        validate: {
          isEmail: true                 // Email validation
        },
        comment: 'Email address'
      },
      // Phone
      phone: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Phone number'
      },
      // Current address
      current_address: {
        type: Sequelize.TEXT,            // Field type: Text
        allowNull: false,               // Required field
        comment: 'Current address'
      },
      // Purpose of visit (foreign key to visa_types table)
      purpose_of_visit_id: {
        type: Sequelize.INTEGER,         // Field type: Integer
        allowNull: false,               // Required field
        comment: 'Purpose of visit (foreign key to visa_types table)'
      },
      // Duration of stay
      duration_of_stay: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Duration of stay'
      },
      // Arrival date
      arrival_date: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        comment: 'Expected arrival date'
      },
      // Accommodation details
      accommodation_details: {
        type: Sequelize.TEXT,            // Field type: Text
        allowNull: false,               // Required field
        comment: 'Accommodation details'
      },
      // Passport copy file path
      passport_copy: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: true,                // Optional field
        comment: 'Passport copy file path'
      },
      // Personal photo file path
      personal_photo: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: true,                // Optional field
        comment: 'Personal photo file path'
      },
      // Hotel booking or invitation file path
      hotel_booking_or_invitation: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: true,                // Optional field
        comment: 'Hotel booking or invitation file path'
      },
      // Travel insurance file path
      travel_insurance: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: true,                // Optional field
        comment: 'Travel insurance file path'
      },
      // Payment method
      payment_method: {
        type: Sequelize.STRING,          // Field type: String
        allowNull: false,               // Required field
        comment: 'Payment method'
      },
      // Submission date
      submission_date: {
        type: Sequelize.DATE,            // Field type: Date
        allowNull: false,               // Required field
        defaultValue: Sequelize.NOW,    // Default value: Current timestamp
        comment: 'Application submission date'
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

    console.log('✅ Successfully created e_visa_applications table');
  },

  async down (queryInterface, Sequelize) {
    // Drop the e_visa_applications table
    await queryInterface.dropTable('e_visa_applications');
    console.log('✅ Successfully dropped e_visa_applications table');
  }
};