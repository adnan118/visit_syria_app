/*
Owner Contact Information Model (ownerContactModel.js)
----------------------------------------------
Purpose:
- Defines the "OwnerContact" model using Sequelize ORM
- Represents the owner_contact table in the database
- Contains all required fields for owner contact information

Libraries Used:
- DataTypes: For data types in Sequelize
- sequelize: Configured ORM object for database interaction
*/

// Import data types from Sequelize library
const { DataTypes } = require('sequelize');
// Import the configured sequelize object from the setup file
const sequelize = require('./sequelize');

// Define OwnerContact model using Sequelize
const OwnerContact = sequelize.define('OwnerContact', {
  // Unique identifier for each record
  id: {
    type: DataTypes.INTEGER,        // Field type: Integer
    primaryKey: true,              // Primary key
    autoIncrement: true            // Auto-incrementing
  },
  // Address in Arabic
  address_ar: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Address in English
  address_en: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Call number
  callNumber: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Email
  email: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false,              // Required field
    validate: {
      isEmail: true                // Email validation
    }
  },
  // Chat number
  chatNumber: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Social media links as JSON array
  socialMediaLinks: {
    type: DataTypes.JSON,           // Field type: JSON
    allowNull: true,               // Optional field
    defaultValue: []               // Default value: Empty array
  },
  // Creation date
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW    // Default value: Current time
  },
  // Last update date
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  // Table name in the database
  tableName: 'owner_contact',
  // Enable automatic fields (createdAt and updatedAt)
  timestamps: true
});

// Export the model for use in other parts of the project
module.exports = OwnerContact;