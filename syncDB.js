// syncDB-simple.js
const { Sequelize } = require('sequelize');

// إنشاء اتصال مباشر
const sequelize = new Sequelize({
  database: 'vs_application_db',
  username: 'vs_user',
  password: 'Vs123456!',
  host: '127.0.0.1',
  port: 3306,
  dialect: 'mysql',
  logging: console.log,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

async function syncDatabase() {
  try {
    console.log('🔌 جاري اختبار الاتصال...');
    await sequelize.authenticate();
    console.log('✅ تم الاتصال بقاعدة البيانات بنجاح');

    // استيراد النماذج يدوياً
    console.log('📦 جاري تحميل النماذج...');
    
    // استيراد كل نموذج على حدة
    const User = require('./models/User')(sequelize);
    const Post = require('./models/Post')(sequelize);
    // أضف باقي النماذج هنا...
    
    console.log('🔄 جاري مزامنة الجداول...');
    await sequelize.sync({ force: false, alter: true });
    console.log('✅ تم مزامنة الجداول بنجاح');

    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('📊 الجداول المنشأة:', tables.map(t => Object.values(t)[0]));

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await sequelize.close();
    console.log('🔒 تم إغلاق الاتصال');
  }
}

syncDatabase();
