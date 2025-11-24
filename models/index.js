/*
 * ملف تهيئة النماذج (index.js)
 * ======================
 * 
 * الوظيفة الرئيسية:
 * ---------------
 * - تحميل جميع نماذج قاعدة البيانات
 * - تعريف العلاقات بين النماذج
 * - تجنب مشاكل التبعية الدائرية
 * - توفير واجهة موحدة للوصول إلى جميع النماذج
 * 
 * لماذا نستخدم هذا الملف:
 * ---------------------
 * 1. لتجنب مشاكل الاستيراد المتبادل بين الملفات
 * 2. لتحديد العلاقات في مكان مركزي واحد
 * 3. لضمان تحميل جميع النماذج بشكل صحيح
 * 4. لتحسين أداء التطبيق من خلال تجنب تعريف العلاقات المتكررة
 */

// تحميل النماذج
const User = require('./userModel');
const Post = require('./postModel');
const Like = require('./likeModel');
const Comment = require('./commentModel');
const Story = require('./storyModel');
const Tag = require('./tagModel');
const Save = require('./saveModel');
const Service = require('./serviceModel');
const Token = require('./tokenModel');
const UserInterest = require('./userInterestModel');
const EmergencyService = require('./emergencyServiceModel'); // استيراد نموذج خدمة الطوارئ
const Exhibitions = require('./exhibitionsModel'); // استيراد نموذج المعارض
const FestivalsEvents = require('./festivalsEventsModel'); // استيراد نموذج المهرجانات والأحداث
const Offer = require('./offerModel'); // استيراد نموذج العروض
const City = require('./cityModel'); // استيراد نموذج المدينة
const TourGuide = require('./tourGuideModel'); // استيراد نموذج المرشد السياحي
const Favorites = require('./favoritesModel'); // استيراد نموذج المفضلات
const Trip = require('./tripModel'); // استيراد نموذج الرحلات
const Experience = require('./experienceModel'); // استيراد نموذج التجارب
const Explore = require('./exploreModel'); // استيراد نموذج Explore
const EVisa = require('./eVisaModel'); // استيراد نموذج eVisa
const VisaType = require('./visaTypeModel'); // استيراد نموذج نوع التأشيرة

// تحديد العلاقات بين النماذج (تجنب تعريفها إذا كانت موجودة بالفعل)

// العلاقة بين المستخدمين والمنشورات
if (!User.associations || !User.associations.posts) {
  User.hasMany(Post, {
    foreignKey: 'userId',
    as: 'posts'
  });
}

if (!Post.associations || !Post.associations.user) {
  Post.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المستخدمين والقصص
if (!User.associations || !User.associations.stories) {
  User.hasMany(Story, {
    foreignKey: 'userId',
    as: 'stories'
  });
}

if (!Story.associations || !Story.associations.user) {
  Story.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المستخدمين والإعجابات
if (!User.associations || !User.associations.likes) {
  User.hasMany(Like, {
    foreignKey: 'userId',
    as: 'likes'
  });
}

if (!Like.associations || !Like.associations.user) {
  Like.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المنشورات والإعجابات
if (!Post.associations || !Post.associations.likes) {
  Post.hasMany(Like, {
    foreignKey: 'postId',
    as: 'likes'
  });
}

if (!Like.associations || !Like.associations.post) {
  Like.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
}

// العلاقة بين المستخدمين والتعليقات
if (!User.associations || !User.associations.comments) {
  User.hasMany(Comment, {
    foreignKey: 'userId',
    as: 'comments'
  });
}

if (!Comment.associations || !Comment.associations.user) {
  Comment.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المنشورات والتعليقات
if (!Post.associations || !Post.associations.comments) {
  Post.hasMany(Comment, {
    foreignKey: 'postId',
    as: 'comments'
  });
}

if (!Comment.associations || !Comment.associations.post) {
  Comment.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
}

// العلاقة بين المستخدمين وعمليات الحفظ
if (!User.associations || !User.associations.saves) {
  User.hasMany(Save, {
    foreignKey: 'userId',
    as: 'saves'
  });
}

if (!Save.associations || !Save.associations.user) {
  Save.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المنشورات وعمليات الحفظ
if (!Post.associations || !Post.associations.saves) {
  Post.hasMany(Save, {
    foreignKey: 'postId',
    as: 'saves'
  });
}

if (!Save.associations || !Save.associations.post) {
  Save.belongsTo(Post, {
    foreignKey: 'postId',
    as: 'post'
  });
}

// العلاقة بين المستخدمين والتوكنات
if (!User.associations || !User.associations.tokens) {
  User.hasMany(Token, {
    foreignKey: 'userId',
    as: 'tokens'
  });
}

if (!Token.associations || !Token.associations.user) {
  Token.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المستخدمين والوسوم (الاهتمامات)
if (!User.associations || !User.associations.interests) {
  User.belongsToMany(Tag, {
    through: UserInterest,
    as: 'interests',
    foreignKey: 'userId',
    otherKey: 'tagId',
    timestamps: true
  });
}

if (!Tag.associations || !Tag.associations.interestedUsers) {
  Tag.belongsToMany(User, {
    through: UserInterest,
    as: 'interestedUsers',
    foreignKey: 'tagId',
    otherKey: 'userId',
    timestamps: true
  });
}

// العلاقة بين المستخدمين والمفضلات
if (!User.associations || !User.associations.favorites) {
  User.hasMany(Favorites, {
    foreignKey: 'userId',
    as: 'favorites'
  });
}

if (!Favorites.associations || !Favorites.associations.user) {
  Favorites.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المعارض والمفضلات
if (!Exhibitions.associations || !Exhibitions.associations.exhibitionFavorites) {
  Exhibitions.hasMany(Favorites, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'exhibitionFavorites',
    scope: {
      itemType: 'Exhibitions'
    }
  });
}

// العلاقة بين المهرجانات والأحداث والمفضلات
if (!FestivalsEvents.associations || !FestivalsEvents.associations.festivalEventFavorites) {
  FestivalsEvents.hasMany(Favorites, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'festivalEventFavorites',
    scope: {
      itemType: 'FestivalsEvents'
    }
  });
}

// العلاقة بين المستخدمين والرحلات
if (!User.associations || !User.associations.trips) {
  User.hasMany(Trip, {
    foreignKey: 'userId',
    as: 'trips'
  });
}

if (!Trip.associations || !Trip.associations.user) {
  Trip.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user'
  });
}

// العلاقة بين المعارض والرحلات
if (!Exhibitions.associations || !Exhibitions.associations.exhibitionTrips) {
  Exhibitions.hasMany(Trip, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'exhibitionTrips',
    scope: {
      itemType: 'Exhibitions'
    }
  });
}

if (!Trip.associations || !Trip.associations.exhibition) {
  Trip.belongsTo(Exhibitions, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'exhibition'
  });
}

// العلاقة بين المهرجانات والأحداث والرحلات
if (!FestivalsEvents.associations || !FestivalsEvents.associations.festivalEventTrips) {
  FestivalsEvents.hasMany(Trip, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'festivalEventTrips',
    scope: {
      itemType: 'FestivalsEvents'
    }
  });
}

if (!Trip.associations || !Trip.associations.festivalEvent) {
  Trip.belongsTo(FestivalsEvents, {
    foreignKey: 'itemId',
    constraints: false,
    as: 'festivalEvent'
  });
}

// العلاقة بين المدن والمرشدين السياحيين
if (!City.associations || !City.associations.tourGuides) {
  City.hasMany(TourGuide, {
    foreignKey: 'cityId',
    as: 'tourGuides'
  });
}

if (!TourGuide.associations || !TourGuide.associations.city) {
  TourGuide.belongsTo(City, {
    foreignKey: 'cityId',
    as: 'city'
  });
}

// العلاقة بين المرشدين السياحيين والتجارب
if (!TourGuide.associations || !TourGuide.associations.experiences) {
  TourGuide.hasMany(Experience, {
    foreignKey: 'tourGuideId',
    as: 'experiences',
    onDelete: 'CASCADE',
    hooks: true
  });
}

if (!Experience.associations || !Experience.associations.tourGuide) {
  Experience.belongsTo(TourGuide, {
    foreignKey: 'tourGuideId',
    as: 'tourGuide',
    onDelete: 'CASCADE',
    hooks: true
  });
}

// العلاقة بين المدن و Explore
if (!City.associations || !City.associations.explores) {
  City.hasMany(Explore, {
    foreignKey: 'cityId',
    as: 'explores'
  });
}

if (!Explore.associations || !Explore.associations.city) {
  Explore.belongsTo(City, {
    foreignKey: 'cityId',
    as: 'city'
  });
}

// العلاقة بين eVisa وأنواع التأشيرات
if (!EVisa.associations || !EVisa.associations.visaType) {
  EVisa.belongsTo(VisaType, {
    foreignKey: 'purpose_of_visit_id',
    as: 'visaType'
  });
}

if (!VisaType.associations || !VisaType.associations.eVisas) {
  VisaType.hasMany(EVisa, {
    foreignKey: 'purpose_of_visit_id',
    as: 'eVisas'
  });
}

// تصدير النماذج مع العلاقات
module.exports = {
  User,
  Post,
  Like,
  Comment,
  Story,
  Tag,
  Save,
  Service,
  Token,
  UserInterest,
  EmergencyService, // تصدير نموذج خدمة الطوارئ
  Exhibitions, // تصدير نموذج المعارض
  FestivalsEvents, // تصدير نموذج المهرجانات والأحداث
  Offer, // تصدير نموذج العروض
  City, // تصدير نموذج المدينة
  TourGuide, // تصدير نموذج المرشد السياحي
  Favorites, // تصدير نموذج المفضلات
  Trip, // تصدير نموذج الرحلات
  Experience, // تصدير نموذج التجارب
  Explore, // تصدير نموذج Explore
  EVisa, // تصدير نموذج eVisa
  VisaType // تصدير نموذج نوع التأشيرة
};