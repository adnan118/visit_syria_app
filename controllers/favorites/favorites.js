// controllers/favorites/favorites.js
// إدارة المفضلات (Favorites)

const { Favorites, Exhibitions, FestivalsEvents, User } = require("../../models");

exports.toggle = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    // الحصول على itemType و itemId من params أو body
    let { itemType, itemId } = req.params;
    
    // إذا لم يتم توفير itemType و itemId في params، نحاول الحصول عليها من body
    if (!itemType && !itemId) {
      itemType = req.body.itemType;
      itemId = req.body.itemId;
    }
    
    // التحقق من نوع العنصر
    if (!['Exhibitions', 'FestivalsEvents'].includes(itemType)) {
      const error = new Error("Invalid item type");
      error.status = 400;
      throw error;
    }
    
    // التحقق من أن itemId هو رقم
    if (!itemId || isNaN(itemId)) {
      const error = new Error("Invalid item ID");
      error.status = 400;
      throw error;
    }
    
    // التحقق من وجود العنصر قبل إنشاء المفضلة
    let itemExists = false;
    if (itemType === 'Exhibitions') {
      const exhibition = await Exhibitions.findByPk(itemId);
      itemExists = !!exhibition;
    } else if (itemType === 'FestivalsEvents') {
      const festivalEvent = await FestivalsEvents.findByPk(itemId);
      itemExists = !!festivalEvent;
    }
    
    if (!itemExists) {
      const error = new Error("Item not found");
      error.status = 404;
      throw error;
    }
    
    const found = await Favorites.findOne({ 
      where: { 
        itemType: itemType, 
        itemId: itemId, 
        userId: userId 
      } 
    });
    
    if (found) {
      await found.destroy();
      return res.json({ status: "success", favorited: false });
    }
    
    await Favorites.create({ 
      itemType: itemType, 
      itemId: itemId, 
      userId: userId 
    });
    
    res.json({ status: "success", favorited: true });
  } catch (e) {
    next(e);
  }
};

exports.listByMe = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    const favorites = await Favorites.findAll({
      where: { userId: userId },
      include: [
        {
          model: Exhibitions,
          as: 'exhibition',
          required: false
        },
        {
          model: FestivalsEvents,
          as: 'festivalEvent',
          required: false
        }
      ]
    });

    // تنسيق البيانات للرد
    const formattedFavorites = favorites.map(favorite => {
      if (favorite.itemType === 'Exhibitions' && favorite.exhibition) {
        return {
          id: favorite.id,
          itemType: favorite.itemType,
          itemTypeName: favorite.itemTypeName, // استخدام طريقة الترجمة
          item: favorite.exhibition
        };
      } else if (favorite.itemType === 'FestivalsEvents' && favorite.festivalEvent) {
        return {
          id: favorite.id,
          itemType: favorite.itemType,
          itemTypeName: favorite.itemTypeName, // استخدام طريقة الترجمة
          item: favorite.festivalEvent
        };
      }
      return null;
    }).filter(Boolean); // إزالة القيم الفارغة

    res.json({ status: "success", data: formattedFavorites });
  } catch (e) {
    next(e);
  }
};

// الحصول على حالة المفضلة لعنصر معين
exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    const { itemType, itemId } = req.params;
    
    // التحقق من نوع العنصر
    if (!['Exhibitions', 'FestivalsEvents'].includes(itemType)) {
      const error = new Error("Invalid item type");
      error.status = 400;
      throw error;
    }
    
    const found = await Favorites.findOne({ 
      where: { 
        itemType: itemType, 
        itemId: itemId, 
        userId: userId 
      } 
    });
    
    res.json({ status: "success", favorited: !!found });
  } catch (e) {
    next(e);
  }
};