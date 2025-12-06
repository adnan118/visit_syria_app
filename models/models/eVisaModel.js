/*
E-Visa Model (eVisaModel.js)
----------------------------
Purpose:
- Defines the "EVisa" model using Sequelize ORM
- Represents the e_visa_applications table in the database
- Contains all required fields for E-Visa applications

Libraries Used:
- DataTypes: For data types in Sequelize
- sequelize: Configured ORM object for database interaction
*/

// Import data types from Sequelize library
const { DataTypes } = require('sequelize');
// Import the configured sequelize object from the setup file
const sequelize = require('./sequelize');

// Define EVisa model using Sequelize
const EVisa = sequelize.define('EVisa', {
  // Unique identifier for each record
  id: {
    type: DataTypes.INTEGER,        // Field type: Integer
    primaryKey: true,              // Primary key
    autoIncrement: true            // Auto-incrementing
  },
  // User ID (foreign key to users table)
  userId: {
    type: DataTypes.STRING,         // Field type: String (MongoDB ObjectId)
    allowNull: false               // Required field
  },
  // Full name
  full_name: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Gender with Arabic and English translations
  gender: {
    type: DataTypes.ENUM(           // Field type: Enum with specific values
      'Male',
      'Female'
    ),
    allowNull: false               // Required field
  },
  // Date of birth
  date_of_birth: {
    type: DataTypes.DATE,           // Field type: Date
    allowNull: false               // Required field
  },
  // Nationality
  nationality: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Passport number
  passport_number: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Passport expiry date
  passport_expiry: {
    type: DataTypes.DATE,           // Field type: Date
    allowNull: false               // Required field
  },
  // Email
  email: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false,              // Required field
    validate: {
      isEmail: true                // Email validation
    }
  },
  // Phone
  phone: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Current address
  current_address: {
    type: DataTypes.TEXT,           // Field type: Text
    allowNull: false               // Required field
  },
  // Purpose of visit (foreign key to visa_types table)
  purpose_of_visit_id: {
    type: DataTypes.INTEGER,        // Field type: Integer
    allowNull: false               // Required field
  },
  // Duration of stay
  duration_of_stay: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Arrival date
  arrival_date: {
    type: DataTypes.DATE,           // Field type: Date
    allowNull: false               // Required field
  },
  // Accommodation details
  accommodation_details: {
    type: DataTypes.TEXT,           // Field type: Text
    allowNull: false               // Required field
  },
  // Passport copy file path
  passport_copy: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: true                // Optional field
  },
  // Personal photo file path
  personal_photo: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: true                // Optional field
  },
  // Hotel booking or invitation file path
  hotel_booking_or_invitation: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: true                // Optional field
  },
  // Travel insurance file path
  travel_insurance: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: true                // Optional field
  },
  // Payment method
  payment_method: {
    type: DataTypes.STRING,         // Field type: String
    allowNull: false               // Required field
  },
  // Submission date
  submission_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW    // Default value: Current time
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
  tableName: 'e_visa_applications',
  // Enable automatic fields (createdAt and updatedAt)
  timestamps: true,
  // Add getter methods for Arabic and English translations
  getterMethods: {
    // Getter method for gender translations
    genderTranslations() {
      const rawValue = this.getDataValue('gender');
      if (!rawValue) return null;
      
      // Map genders to Arabic and English descriptions
      const translations = {
        'Male': { 
          en: 'Male', 
          ar: 'ذكر' 
        },
        'Female': { 
          en: 'Female', 
          ar: 'أنثى' 
        }
      };
      
      return translations[rawValue] || { en: rawValue, ar: rawValue };
    }
  }
});

// Export the model for use in other parts of the project
module.exports = EVisa;