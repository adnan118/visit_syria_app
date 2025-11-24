const { sequelize } = require('./models');

async function syncDatabase() {
  try {
    // اختبار الاتصال بقاعدة البيانات
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // مزامنة جميع النماذج مع قاعدة البيانات
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ تم مزامنة جميع الجداول بنجاح');

    // عرض الجداول المنشأة
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('📊 الجداول المنشأة:', tables.map(t => Object.values(t)[0]));

  } catch (error) {
    console.error('❌ خطأ في مزامنة قاعدة البيانات:', error);
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
