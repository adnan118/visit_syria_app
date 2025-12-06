/*
Visa Type Model (visaTypeModel.js)
---------------------------------
Purpose:
- Defines the "VisaType" model using Sequelize ORM
- Represents the visa_types table in the database
- Contains all required fields for visa type information

Libraries Used:
- DataTypes: For data types in Sequelize
- sequelize: Configured ORM object for database interaction
*/

// Import data types from Sequelize library
const { DataTypes } = require('sequelize');
// Import the configured sequelize object from the setup file
const sequelize = require('./sequelize');

// Define VisaType model using Sequelize
const VisaType = sequelize.define('VisaType', {
  // Unique identifier for each record
  id: {
    type: DataTypes.INTEGER,        // Field type: Integer
    primaryKey: true,              // Primary key
    autoIncrement: true            // Auto-incrementing
  },
  // Purpose of visit in English
  purpose_of_visit_en: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Purpose of visit in Arabic
  purpose_of_visit_ar: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Fee amount
  fee_amount: {
    type: DataTypes.DECIMAL(10, 2), // Field type: Decimal with 10 digits and 2 decimal places
    allowNull: false               // Required field
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
  tableName: 'visa_types',
  // Enable automatic fields (createdAt and updatedAt)
  timestamps: true
});

// Export the model for use in other parts of the project
module.exports = VisaType;