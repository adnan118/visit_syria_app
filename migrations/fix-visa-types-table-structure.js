/*
Fix Visa Types Table Structure Migration (fix-visa-types-table-structure.js)
--------------------------------------
Purpose:
- Fixes the visa_types table structure to match the updated model
- Adds purpose_of_visit_en and purpose_of_visit_ar columns if they don't exist
- Populates data from the existing purpose_of_visit column
- Removes the old purpose_of_visit ENUM column if it exists
- Can be executed using Sequelize CLI
*/

'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    console.log('Starting visa_types table structure fix...');
    
    // Check if purpose_of_visit_en column exists
    let hasPurposeOfVisitEn = false;
    try {
      const [enColumnResults] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM visa_types LIKE 'purpose_of_visit_en'"
      );
      hasPurposeOfVisitEn = enColumnResults && enColumnResults.length > 0;
      console.log('purpose_of_visit_en column exists:', hasPurposeOfVisitEn);
    } catch (error) {
      console.log('Error checking purpose_of_visit_en column:', error.message);
    }
    
    // Check if purpose_of_visit_ar column exists
    let hasPurposeOfVisitAr = false;
    try {
      const [arColumnResults] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM visa_types LIKE 'purpose_of_visit_ar'"
      );
      hasPurposeOfVisitAr = arColumnResults && arColumnResults.length > 0;
      console.log('purpose_of_visit_ar column exists:', hasPurposeOfVisitAr);
    } catch (error) {
      console.log('Error checking purpose_of_visit_ar column:', error.message);
    }
    
    // Add purpose_of_visit_en column if it doesn't exist
    if (!hasPurposeOfVisitEn) {
      console.log('Adding purpose_of_visit_en column...');
      await queryInterface.addColumn('visa_types', 'purpose_of_visit_en', {
        type: Sequelize.STRING,
        allowNull: true, // Allow null temporarily
        comment: 'Purpose of visit in English'
      });
    }
    
    // Add purpose_of_visit_ar column if it doesn't exist
    if (!hasPurposeOfVisitAr) {
      console.log('Adding purpose_of_visit_ar column...');
      await queryInterface.addColumn('visa_types', 'purpose_of_visit_ar', {
        type: Sequelize.STRING,
        allowNull: true, // Allow null temporarily
        comment: 'Purpose of visit in Arabic'
      });
    }
    
    // Check if old purpose_of_visit column exists
    let hasOldPurposeOfVisit = false;
    try {
      const [oldColumnResults] = await queryInterface.sequelize.query(
        "SHOW COLUMNS FROM visa_types LIKE 'purpose_of_visit'"
      );
      hasOldPurposeOfVisit = oldColumnResults && oldColumnResults.length > 0;
      console.log('Old purpose_of_visit column exists:', hasOldPurposeOfVisit);
    } catch (error) {
      console.log('Error checking old purpose_of_visit column:', error.message);
    }
    
    // Copy data from the old column to the new columns (if the old column exists)
    if (hasOldPurposeOfVisit) {
      console.log('Copying data from old purpose_of_visit column to new columns...');
      
      // Define mappings for English and Arabic translations
      const translations = {
        'Tourism': { en: 'Tourism', ar: 'سياحة' },
        'Business': { en: 'Business', ar: 'أعمال' },
        'Family Visit': { en: 'Family Visit', ar: 'زيارة عائلية' },
        'Study': { en: 'Study', ar: 'دراسة' },
        'Medical Treatment': { en: 'Medical Treatment', ar: 'علاج طبي' },
        'Other': { en: 'Other', ar: 'أخرى' }
      };
      
      // Update each record with appropriate translations
      for (const [key, value] of Object.entries(translations)) {
        await queryInterface.sequelize.query(
          `UPDATE visa_types SET purpose_of_visit_en = '${value.en}', purpose_of_visit_ar = '${value.ar}' WHERE purpose_of_visit = '${key}'`
        );
      }
    } else {
      // If the old column doesn't exist, set default values for existing records
      console.log('Setting default values for existing records...');
      await queryInterface.sequelize.query(
        "UPDATE visa_types SET purpose_of_visit_en = 'Tourism', purpose_of_visit_ar = 'سياحة' WHERE purpose_of_visit_en IS NULL OR purpose_of_visit_en = ''"
      );
    }
    
    // Make the new columns NOT NULL after populating data
    console.log('Setting purpose_of_visit_en column to NOT NULL...');
    await queryInterface.changeColumn('visa_types', 'purpose_of_visit_en', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Purpose of visit in English'
    });
    
    console.log('Setting purpose_of_visit_ar column to NOT NULL...');
    await queryInterface.changeColumn('visa_types', 'purpose_of_visit_ar', {
      type: Sequelize.STRING,
      allowNull: false,
      comment: 'Purpose of visit in Arabic'
    });
    
    // Remove the old column if it exists
    if (hasOldPurposeOfVisit) {
      console.log('Removing old purpose_of_visit column...');
      await queryInterface.removeColumn('visa_types', 'purpose_of_visit');
    }
    
    console.log('✅ Successfully fixed visa_types table structure');
  },

  async down (queryInterface, Sequelize) {
    console.log('Reverting visa_types table structure fix...');
    
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
    
    // Copy data from the new columns to the old column
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