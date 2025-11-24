/*
ملف CRUD لإدارة المدن (citiesController.js)
------------------------------------------
الوظائف:
- createCity     → إنشاء مدينة جديدة
- getAllCities   → عرض جميع المدن
- getCityById    → عرض مدينة محددة
- updateCity     → تحديث مدينة
- deleteCity     → حذف مدينة
*/

const City = require('../../models/cityModel');

// إنشاء مدينة جديدة
exports.createCity = async (req, res, next) => {
  try {
    const { name_ar, name_en } = req.body;

    if (!name_ar || !name_en) {
      const error = new Error('Please enter name in both Arabic and English.');
      error.status = 400;
      throw error;
    }

    const newCity = await City.create({ name_ar, name_en });

    res.status(201).json({
      status: "success",
      message: "✅ City created successfully.",
      data: newCity
    });
  } catch (error) {
    next(error);
  }
};

// عرض جميع المدن
exports.getAllCities = async (req, res, next) => {
  try {
    const cities = await City.findAll({
      order: [['id', 'ASC']]
    });
    res.status(200).json({
      status: "success",
      message: "✅ All cities retrieved successfully.",
      count: cities.length,
      data: cities
    });
  } catch (error) {
    next(error);
  }
};

// عرض مدينة محددة بالرقم المعرف
exports.getCityById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);

    if (!city) {
      const error = new Error('City not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({ 
      status: "success",
      message: "✅ City found.", 
      data: city 
    });
  } catch (error) {
    next(error);
  }
};

// تحديث مدينة
exports.updateCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name_ar, name_en } = req.body;

    const city = await City.findByPk(id);
    if (!city) {
      const error = new Error('City not found.');
      error.status = 404;
      throw error;
    }

    await city.update({ name_ar, name_en });

    res.status(200).json({ 
      status: "success",
      message: "✅ City updated successfully.", 
      data: city 
    });
  } catch (error) {
    next(error);
  }
};

// حذف مدينة
exports.deleteCity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const city = await City.findByPk(id);

    if (!city) {
      const error = new Error('City not found.');
      error.status = 404;
      throw error;
    }

    await city.destroy();
    res.status(200).json({ 
      status: "success",
      message: "🗑️ City deleted successfully." 
    });
  } catch (error) {
    next(error);
  }
};