/*
مهاجر إنشاء جدول المفضلات (create-favorites-table.js)
--------------------------------------------
- إنشاء جدول المفضلات في قاعدة البيانات
- يحتوي على جميع الحقول المطلوبة للمفضلات
*/

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('favorites', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      itemType: {
        type: Sequelize.ENUM('Exhibitions', 'FestivalsEvents'),
        allowNull: false
      },
      itemId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // التحقق من وجود الفهارس قبل إنشائها
    try {
      // إنشاء فهارس للجدول
      await queryInterface.addIndex('favorites', ['userId', 'itemType', 'itemId'], {
        unique: true,
        name: 'favorites_user_item_unique'
      });
    } catch (error) {
      // تجاهل الخطأ إذا كان الفهرس موجوداً بالفعل
      console.log('Index favorites_user_item_unique already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('favorites', ['userId'], {
        name: 'favorites_user_id_index'
      });
    } catch (error) {
      // تجاهل الخطأ إذا كان الفهرس موجوداً بالفعل
      console.log('Index favorites_user_id_index already exists or failed to create');
    }
    
    try {
      await queryInterface.addIndex('favorites', ['itemType', 'itemId'], {
        name: 'favorites_item_type_id_index'
      });
    } catch (error) {
      // تجاهل الخطأ إذا كان الفهرس موجوداً بالفعل
      console.log('Index favorites_item_type_id_index already exists or failed to create');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // إزالة الفهارس قبل حذف الجدول
    try {
      await queryInterface.removeIndex('favorites', 'favorites_user_item_unique');
    } catch (error) {
      // تجاهل الخطأ إذا لم يكن الفهرس موجوداً
      console.log('Index favorites_user_item_unique does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('favorites', 'favorites_user_id_index');
    } catch (error) {
      // تجاهل الخطأ إذا لم يكن الفهرس موجوداً
      console.log('Index favorites_user_id_index does not exist or failed to remove');
    }
    
    try {
      await queryInterface.removeIndex('favorites', 'favorites_item_type_id_index');
    } catch (error) {
      // تجاهل الخطأ إذا لم يكن الفهرس موجوداً
      console.log('Index favorites_item_type_id_index does not exist or failed to remove');
    }
    
    await queryInterface.dropTable('favorites');
  }
};