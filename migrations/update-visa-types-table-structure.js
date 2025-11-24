/*
Update Visa Types Table Structure Migration (update-visa-types-table-structure.js)
--------------------------------------
Purpose:
- Updates the visa_types table structure to match the new model
- Adds purpose_of_visit_en and purpose_of_visit_ar columns
- Removes the old purpose_of_visit ENUM column
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Add the new columns
    await queryInterface.addColumn('visa_types', 'purpose_of_visit_en', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null temporarily
      comment: 'Purpose of visit in English'
    });
    
    await queryInterface.addColumn('visa_types', 'purpose_of_visit_ar', {
      type: Sequelize.STRING,
      allowNull: true, // Allow null temporarily
      comment: 'Purpose of visit in Arabic'
    });
    
    // Copy data from the old column to the new columns (if the old column exists)
    // This is a safety measure in case the column still exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM visa_types LIKE 'purpose_of_visit'"
    );
    
    if (results && results.length > 0) {
      // If the old column exists, copy data
      await queryInterface.sequelize.query(
        "UPDATE visa_types SET purpose_of_visit_en = purpose_of_visit, purpose_of_visit_ar = purpose_of_visit"
      );
    } else {
      // If the old column doesn't exist, set default values
      await queryInterface.sequelize.query(
        "UPDATE visa_types SET purpose_of_visit_en = 'Tourism', purpose_of_visit_ar = 'سياحة' WHERE purpose_of_visit_en IS NULL"
      );
    }
    
    // Make the new columns NOT NULL after populating data
    await queryInterface.changeColumn('visa_types', 'purpose_of_visit_en', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Purpose of visit in English'
    });
    
    await queryInterface.changeColumn('visa_types', 'purpose_of_visit_ar', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Purpose of visit in Arabic'
    });
    
    // Remove the old column if it exists
    const [oldColumnResults] = await queryInterface.sequelize.query(
      "SHOW COLUMNS FROM visa_types LIKE 'purpose_of_visit'"
    );
    
    if (oldColumnResults && oldColumnResults.length > 0) {
      await queryInterface.removeColumn('visa_types', 'purpose_of_visit');
    }
    
    console.log('✅ Successfully updated visa_types table structure');
  },

  async down (queryInterface, Sequelize) {
    // Add back the old column
    await queryInterface.addColumn('visa_types', 'purpose_of_visit', {
      type: Sequelize.ENUM(
        'Tourism',
        'Business',
        'Family Visit',
        'Study',
        'Medical Treatment',
        'Other'
      ),
      allowNull: true,
      comment: 'Purpose of visit (Tourism, Business, Family Visit, Study, Medical Treatment, Other)'
    });
    
    // Copy data from the new columns to the old column (if data exists)
    await queryInterface.sequelize.query(
      "UPDATE visa_types SET purpose_of_visit = purpose_of_visit_en"
    );
    
    // Make the old column NOT NULL after populating data
    await queryInterface.changeColumn('visa_types', 'purpose_of_visit', {
      type: Sequelize.ENUM(
        'Tourism',
        'Business',
        'Family Visit',
        'Study',
        'Medical Treatment',
        'Other'
      ),
      allowNull: false,
      comment: 'Purpose of visit (Tourism, Business, Family Visit, Study, Medical Treatment, Other)'
    });
    
    // Remove the new columns
    await queryInterface.removeColumn('visa_types', 'purpose_of_visit_en');
    await queryInterface.removeColumn('visa_types', 'purpose_of_visit_ar');
    
    console.log('✅ Successfully reverted visa_types table structure');
  }
};