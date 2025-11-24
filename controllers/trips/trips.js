// controllers/trips/trips.js
// إدارة الرحلات (Trips)

const { Trip, Exhibitions, FestivalsEvents, User } = require("../../models");
const { Sequelize } = require('sequelize');

exports.toggle = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    // الحصول على name و itemType و itemId من params أو body
    let { name, itemType, itemId } = req.params;
    
    // إذا لم يتم توفير البيانات في params، نحاول الحصول عليها من body
    if (!name && !itemType && !itemId) {
      name = req.body.name;
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
    
    // التحقق من وجود العنصر قبل إنشاء الرحلة
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
    
    const found = await Trip.findOne({ 
      where: { 
        name: name,
        itemType: itemType, 
        itemId: itemId, 
        userId: userId 
      } 
    });
    
    if (found) {
      await found.destroy();
      return res.json({ status: "success", added: false });
    }
    
    await Trip.create({ 
      name: name,
      itemType: itemType, 
      itemId: itemId, 
      userId: userId 
    });
    
    res.json({ status: "success", added: true });
  } catch (e) {
    next(e);
  }
};

exports.listNames = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    // الحصول على الأسماء الفريدة للرحلات الخاصة بالمستخدم
    const names = await Trip.findAll({
      where: { userId: userId },
      attributes: ['name'],
      group: ['name'],
      order: [['createdAt', 'DESC']]
    });
    
    // استخراج الأسماء من النتائج
    const nameList = names.map(trip => trip.name);
    
    res.json({ status: "success", data: nameList });
  } catch (e) {
    next(e);
  }
};

exports.getByName = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    const { name } = req.params;
    
    const trips = await Trip.findAll({
      where: { 
        userId: userId,
        name: name
      },
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
      ],
      order: [['createdAt', 'DESC']]
    });

    // تنسيق البيانات للرد
    const formattedTrips = trips.map(trip => {
      if (trip.itemType === 'Exhibitions' && trip.exhibition) {
        return {
          id: trip.id,
          name: trip.name,
          itemType: trip.itemType,
          itemTypeName: trip.itemTypeName,
          item: trip.exhibition
        };
      } else if (trip.itemType === 'FestivalsEvents' && trip.festivalEvent) {
        return {
          id: trip.id,
          name: trip.name,
          itemType: trip.itemType,
          itemTypeName: trip.itemTypeName,
          item: trip.festivalEvent
        };
      }
      return null;
    }).filter(Boolean);

    res.json({ status: "success", data: formattedTrips });
  } catch (e) {
    next(e);
  }
};

exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    const {   itemType, itemId } = req.params;
    
    // التحقق من نوع العنصر
    if (!['Exhibitions', 'FestivalsEvents'].includes(itemType)) {
      const error = new Error("Invalid item type");
      error.status = 400;
      throw error;
    }
    
    const found = await Trip.findOne({ 
      where: { 
     
        itemType: itemType, 
        itemId: itemId, 
        userId: userId 
      } 
    });
    
    res.json({ status: "success", added: !!found });
  } catch (e) {
    next(e);
  }
};

exports.updateName = async (req, res, next) => {
  try {
    const userId = req.auth?.userId;
    if (!userId) {
      const error = new Error("Unauthorized");
      error.status = 401;
      throw error;
    }
    
    const { oldName, newName } = req.body;
    
    // التحقق من أن الاسم الجديد غير فارغ
    if (!newName || newName.trim() === '') {
      const error = new Error("New name is required");
      error.status = 400;
      throw error;
    }
    
    // التحقق من أن الاسم القديم غير فارغ
    if (!oldName || oldName.trim() === '') {
      const error = new Error("Old name is required");
      error.status = 400;
      throw error;
    }
    
    // التحقق من أن الاسم الجديد مختلف عن القديم
    if (oldName === newName) {
      const error = new Error("New name must be different from old name");
      error.status = 400;
      throw error;
    }
    
    // التحقق من أن المستخدم لا يملك رحلة بنفس الاسم الجديد
    const existingTrip = await Trip.findOne({
      where: {
        userId: userId,
        name: newName
      }
    });
    
    if (existingTrip) {
      const error = new Error("Trip with this name already exists");
      error.status = 400;
      throw error;
    }
    
    // تحديث اسم جميع الرحلات التي تحمل الاسم القديم
    const [updatedRowsCount] = await Trip.update(
      { name: newName },
      {
        where: {
          userId: userId,
          name: oldName
        }
      }
    );
    
    if (updatedRowsCount === 0) {
      const error = new Error("No trips found with the specified old name");
      error.status = 404;
      throw error;
    }
    
    res.json({ 
      status: "success", 
      message: `Trip name updated from '${oldName}' to '${newName}'`,
      updatedCount: updatedRowsCount
    });
  } catch (e) {
    next(e);
  }
};
