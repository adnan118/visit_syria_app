/*
Feedback Model (feedbackModel.js)
---------------------------------
Purpose:
- Defines the "Feedback" model using Sequelize ORM
- Represents the feedback table in the database
- Contains all required fields for user feedback information

Libraries Used:
- DataTypes: For data types in Sequelize
- sequelize: Configured ORM object for database interaction
*/

// Import data types from Sequelize library
const { DataTypes } = require('sequelize');
// Import the configured sequelize object from the setup file
const sequelize = require('./sequelize');

// Define Feedback model using Sequelize
const Feedback = sequelize.define('Feedback', {
  // Unique identifier for each record
  id: {
    type: DataTypes.INTEGER,        // Field type: Integer
    primaryKey: true,              // Primary key
    autoIncrement: true            // Auto-incrementing
  },
  // First Name
  firstName: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Last Name
  lastName: {
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
  // Country
  country: {
    type: DataTypes.STRING,         // Field type: Short text
    allowNull: false               // Required field
  },
  // Feedback content
  feedback: {
    type: DataTypes.TEXT,           // Field type: Long text
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
  tableName: 'feedback',
  // Enable automatic fields (createdAt and updatedAt)
  timestamps: true
});

// Export the model for use in other parts of the project
module.exports = Feedback;