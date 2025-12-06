/*
مهاجر إضافة عمود التصنيف لجدول المهرجانات والأحداث (add-classification-to-festivals-events.js)
--------------------------------------------
- إضافة عمود التصنيف إلى جدول المهرجانات والأحداث في قاعدة البيانات
- يدعم نفس القيم الموجودة في نموذج التطبيق
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the column already exists to avoid errors
    try {
      await queryInterface.addColumn('festivals_events', 'classification', {
        type: Sequelize.ENUM(
          'art',
          'history',
          'science',
          'culture',
          'technology',
          'literature',
          'music',
          'photography',
          'crafts',
          'food',
          'fashion',
          'nature',
          'religion',
          'sports',
          'other'
        ),
        allowNull: true,
        defaultValue: null
      });
      console.log('Successfully added classification column to festivals_events table');
    } catch (error) {
      console.log('Classification column might already exist or there was an error:', error.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('festivals_events', 'classification');
      console.log('Successfully removed classification column from festivals_events table');
    } catch (error) {
      console.log('Error removing classification column:', error.message);
    }
  }
};
