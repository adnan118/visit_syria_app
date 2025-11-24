/*
E-Visa Controller (eVisaController.js)
------------------------------------
Purpose:
- Contains all operations related to E-Visa applications
- Handles creation, reading, updating, and deletion of E-Visa records
- Connects user requests with the EVisa model
*/

// Import models with associations
const { EVisa, VisaType } = require('../../models');
const { Sequelize } = require('sequelize');
const { handleUploadError } = require('../services/mediaHelper');

// دالة آمنة لحذف ملفات eVisa
// تحاول حذف الملفات وتعيد null في حالة الخطأ
const safeDeleteEVisaFiles = async (fileIdentifiers = []) => {
  try {
    console.log("محاولة حذف ملفات eVisa:", fileIdentifiers);
    
    // التحقق من أن المعرفات مصفوفة وليست فارغة
    if (!Array.isArray(fileIdentifiers) || fileIdentifiers.length === 0) {
      console.log("لا توجد ملفات لحذفها");
      return null;
    }
    
    // استيراد دالة حذف ملفات متعددة
    const { deleteMultipleFiles } = require("../services/mediaHelper");
    
    console.log("استدعاء دالة حذف الملفات مع نوع المحتوى: eVisa");
    // حذف الملفات بإدخال نوع المحتوى "eVisa"
    const result = await deleteMultipleFiles(fileIdentifiers, "eVisa");
    console.log("نتيجة حذف ملفات eVisa:", result);
    return result;
  } catch (e) {
    console.error("خطأ في دالة حذف ملفات eVisa:", e);
    // العودة بنتيجة فشل في حالة الخطأ
    return null;
  }
};

// ---------------------------------------------------------
// 🔹 Create new E-Visa application (Users and Admin)
// ---------------------------------------------------------
exports.createEVisaApplication = async (req, res, next) => {
  try {
    // Get user ID from authenticated user
    const userId = req.auth.id;
    
    // Debug logging to see what's being received
    console.log("=== E-Visa Application Debug Info ===");
    console.log("Request headers:", req.headers);
    console.log("Request body:", req.body);
    console.log("Request files:", req.files);
    console.log("Request dbFiles:", req.dbFiles);
    console.log("User ID:", userId);
    
    const {
      full_name,
      gender,
      date_of_birth,
      nationality,
      passport_number,
      passport_expiry,
      email,
      phone,
      current_address,
      purpose_of_visit_id,
      duration_of_stay,
      arrival_date,
      accommodation_details,
      payment_method
    } = req.body;

    console.log("Extracted fields:");
    console.log("Full name:", full_name, "| Type:", typeof full_name);
    console.log("Gender:", gender, "| Type:", typeof gender);
    console.log("Date of birth:", date_of_birth, "| Type:", typeof date_of_birth);
    console.log("Nationality:", nationality, "| Type:", typeof nationality);
    console.log("Passport number:", passport_number, "| Type:", typeof passport_number);
    console.log("Passport expiry:", passport_expiry, "| Type:", typeof passport_expiry);
    console.log("Email:", email, "| Type:", typeof email);
    console.log("Phone:", phone, "| Type:", typeof phone);
    console.log("Current address:", current_address, "| Type:", typeof current_address);
    console.log("Purpose of visit ID:", purpose_of_visit_id, "| Type:", typeof purpose_of_visit_id);
    console.log("Duration of stay:", duration_of_stay, "| Type:", typeof duration_of_stay);
    console.log("Arrival date:", arrival_date, "| Type:", typeof arrival_date);
    console.log("Accommodation details:", accommodation_details, "| Type:", typeof accommodation_details);
    console.log("Payment method:", payment_method, "| Type:", typeof payment_method);

    // Check which fields are missing
    const missingFields = [];
    if (!full_name) missingFields.push("full_name");
    if (!gender) missingFields.push("gender");
    if (!date_of_birth) missingFields.push("date_of_birth");
    if (!nationality) missingFields.push("nationality");
    if (!passport_number) missingFields.push("passport_number");
    if (!passport_expiry) missingFields.push("passport_expiry");
    if (!email) missingFields.push("email");
    if (!phone) missingFields.push("phone");
    if (!current_address) missingFields.push("current_address");
    if (!purpose_of_visit_id) missingFields.push("purpose_of_visit_id");
    if (!duration_of_stay) missingFields.push("duration_of_stay");
    if (!arrival_date) missingFields.push("arrival_date");
    if (!accommodation_details) missingFields.push("accommodation_details");
    if (!payment_method) missingFields.push("payment_method");

    if (missingFields.length > 0) {
      console.log("Missing fields:", missingFields);
      const error = new Error(`Please provide all required fields. Missing: ${missingFields.join(", ")}`);
      error.status = 400;
      throw error;
    }

    // Validate that purpose_of_visit_id exists in visa_types table
    const visaType = await VisaType.findByPk(purpose_of_visit_id);
    if (!visaType) {
      const error = new Error('Invalid purpose of visit ID. Visa type not found.');
      error.status = 400;
      throw error;
    }

    // Prepare file paths from uploaded files (if any)
    const filePaths = {};
    if (req.dbFiles) {
      // Make file fields optional by checking if they exist
      if (req.dbFiles.passportCopy && req.dbFiles.passportCopy.length > 0) {
        filePaths.passport_copy = req.dbFiles.passportCopy[0];
      }
      if (req.dbFiles.personalPhoto && req.dbFiles.personalPhoto.length > 0) {
        filePaths.personal_photo = req.dbFiles.personalPhoto[0];
      }
      if (req.dbFiles.hotelBooking && req.dbFiles.hotelBooking.length > 0) {
        filePaths.hotel_booking_or_invitation = req.dbFiles.hotelBooking[0];
      }
      if (req.dbFiles.travelInsurance && req.dbFiles.travelInsurance.length > 0) {
        filePaths.travel_insurance = req.dbFiles.travelInsurance[0];
      }
    }

    // Create new record in database
    const newEVisaApplication = await EVisa.create({
      userId,
      full_name,
      gender,
      date_of_birth: new Date(date_of_birth),
      nationality,
      passport_number,
      passport_expiry: new Date(passport_expiry),
      email,
      phone,
      current_address,
      purpose_of_visit_id,
      duration_of_stay,
      arrival_date: new Date(arrival_date),
      accommodation_details,
      payment_method,
      ...filePaths
    });

    // Get visa type details for response
    const visaTypeDetails = {
      id: visaType.id,
      purpose_of_visit_en: visaType.purpose_of_visit_en,
      purpose_of_visit_ar: visaType.purpose_of_visit_ar,
      fee_amount: visaType.fee_amount
    };

    // Create clean result object
    const result = {
      id: newEVisaApplication.id,
      userId: newEVisaApplication.userId,
      full_name: newEVisaApplication.full_name,
      gender: newEVisaApplication.gender,
      genderTranslations: newEVisaApplication.genderTranslations,
      date_of_birth: newEVisaApplication.date_of_birth,
      nationality: newEVisaApplication.nationality,
      passport_number: newEVisaApplication.passport_number,
      passport_expiry: newEVisaApplication.passport_expiry,
      email: newEVisaApplication.email,
      phone: newEVisaApplication.phone,
      current_address: newEVisaApplication.current_address,
      purpose_of_visit: visaTypeDetails,
      duration_of_stay: newEVisaApplication.duration_of_stay,
      arrival_date: newEVisaApplication.arrival_date,
      accommodation_details: newEVisaApplication.accommodation_details,
      passport_copy: newEVisaApplication.passport_copy,
      personal_photo: newEVisaApplication.personal_photo,
      hotel_booking_or_invitation: newEVisaApplication.hotel_booking_or_invitation,
      travel_insurance: newEVisaApplication.travel_insurance,
      payment_method: newEVisaApplication.payment_method,
      submission_date: newEVisaApplication.submission_date,
      createdAt: newEVisaApplication.createdAt,
      updatedAt: newEVisaApplication.updatedAt
    };

    res.status(201).json({
      status: "success",
      message: "✅ E-Visa application submitted successfully.",
      data: result
    });
  } catch (error) {
    // Handle multer errors specifically
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      console.error("Multer error - Unexpected field:", error);
      return res.status(400).json({
        status: "error",
        message: "Unexpected file field. Please check that file field names match: passportCopy, personalPhoto, hotelBooking, travelInsurance",
        error: error.message
      });
    }
    
    // Handle file upload errors
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      const errorResponse = handleUploadError(error);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // Delete newly uploaded files in case of error
    if (req.dbFiles) {
      let newFiles = [];
      
      if (req.dbFiles.passportCopy && req.dbFiles.passportCopy.length > 0) {
        newFiles.push(req.dbFiles.passportCopy[0]);
      }
      if (req.dbFiles.personalPhoto && req.dbFiles.personalPhoto.length > 0) {
        newFiles.push(req.dbFiles.personalPhoto[0]);
      }
      if (req.dbFiles.hotelBooking && req.dbFiles.hotelBooking.length > 0) {
        newFiles.push(req.dbFiles.hotelBooking[0]);
      }
      if (req.dbFiles.travelInsurance && req.dbFiles.travelInsurance.length > 0) {
        newFiles.push(req.dbFiles.travelInsurance[0]);
      }
      
      if (newFiles.length > 0) {
        try {
          await safeDeleteEVisaFiles(newFiles);
          console.log("🗑️ تم حذف الملفات الجديدة بعد فشل العملية");
        } catch (deleteError) {
          console.error("❌ خطأ أثناء حذف الملفات الجديدة:", deleteError);
        }
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get all E-Visa applications (Users - own applications, Admin - all applications)
// ---------------------------------------------------------
exports.getAllEVisaApplications = async (req, res, next) => {
  try {
    // Get user ID from authenticated user
    const userId = req.auth.id;
    const isAdmin = req.auth.isAdmin;
    
    // Build query conditions
    const conditions = {};
    if (!isAdmin) {
      conditions.userId = userId;
    }

    // Get all records with visa type information
    const eVisaApplications = await EVisa.findAll({
      where: conditions,
      order: [['id', 'ASC']],
      include: [{
        model: VisaType,
        as: 'visaType',
        required: false
      }]
    });

    // Create clean result objects
    const result = eVisaApplications.map((application) => {
      // Use the associated visaType data directly
      const visaTypeDetails = application.visaType ? {
        id: application.visaType.id,
        purpose_of_visit_en: application.visaType.purpose_of_visit_en,
        purpose_of_visit_ar: application.visaType.purpose_of_visit_ar,
        fee_amount: application.visaType.fee_amount
      } : null;

      return {
        id: application.id,
        userId: application.userId,
        full_name: application.full_name,
        gender: application.gender,
        genderTranslations: application.genderTranslations,
        date_of_birth: application.date_of_birth,
        nationality: application.nationality,
        passport_number: application.passport_number,
        passport_expiry: application.passport_expiry,
        email: application.email,
        phone: application.phone,
        current_address: application.current_address,
        purpose_of_visit: visaTypeDetails,
        duration_of_stay: application.duration_of_stay,
        arrival_date: application.arrival_date,
        accommodation_details: application.accommodation_details,
        passport_copy: application.passport_copy,
        personal_photo: application.personal_photo,
        hotel_booking_or_invitation: application.hotel_booking_or_invitation,
        travel_insurance: application.travel_insurance,
        payment_method: application.payment_method,
        submission_date: application.submission_date,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt
      };
    });

    res.status(200).json({
      status: "success",
      message: "✅ All E-Visa applications retrieved successfully.",
      count: result.length,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Get specific E-Visa application by ID (Users - own applications, Admin - all applications)
// ---------------------------------------------------------
exports.getEVisaApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get user ID from authenticated user
    const userId = req.auth.id;
    const isAdmin = req.auth.isAdmin;

    // Find the application with visa type information
    const eVisaApplication = await EVisa.findByPk(id, {
      include: [{
        model: VisaType,
        as: 'visaType',
        required: false
      }]
    });
    
    if (!eVisaApplication) {
      const error = new Error('E-Visa application not found.');
      error.status = 404;
      throw error;
    }

    // Check if user is authorized to view this application
    if (!isAdmin && eVisaApplication.userId !== userId) {
      const error = new Error('You are not authorized to view this application.');
      error.status = 403;
      throw error;
    }

    // Use the associated visaType data directly
    const visaTypeDetails = eVisaApplication.visaType ? {
      id: eVisaApplication.visaType.id,
      purpose_of_visit_en: eVisaApplication.visaType.purpose_of_visit_en,
      purpose_of_visit_ar: eVisaApplication.visaType.purpose_of_visit_ar,
      fee_amount: eVisaApplication.visaType.fee_amount
    } : null;

    // Create clean result object
    const result = {
      id: eVisaApplication.id,
      userId: eVisaApplication.userId,
      full_name: eVisaApplication.full_name,
      gender: eVisaApplication.gender,
      genderTranslations: eVisaApplication.genderTranslations,
      date_of_birth: eVisaApplication.date_of_birth,
      nationality: eVisaApplication.nationality,
      passport_number: eVisaApplication.passport_number,
      passport_expiry: eVisaApplication.passport_expiry,
      email: eVisaApplication.email,
      phone: eVisaApplication.phone,
      current_address: eVisaApplication.current_address,
      purpose_of_visit: visaTypeDetails,
      duration_of_stay: eVisaApplication.duration_of_stay,
      arrival_date: eVisaApplication.arrival_date,
      accommodation_details: eVisaApplication.accommodation_details,
      passport_copy: eVisaApplication.passport_copy,
      personal_photo: eVisaApplication.personal_photo,
      hotel_booking_or_invitation: eVisaApplication.hotel_booking_or_invitation,
      travel_insurance: eVisaApplication.travel_insurance,
      payment_method: eVisaApplication.payment_method,
      submission_date: eVisaApplication.submission_date,
      createdAt: eVisaApplication.createdAt,
      updatedAt: eVisaApplication.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ E-Visa application found.",
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Update E-Visa application (Users - own applications, Admin - all applications)
// ---------------------------------------------------------
exports.updateEVisaApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get user ID from authenticated user
    const userId = req.auth.id;
    const isAdmin = req.auth.isAdmin;

    const {
      full_name,
      gender,
      date_of_birth,
      nationality,
      passport_number,
      passport_expiry,
      email,
      phone,
      current_address,
      purpose_of_visit_id,
      duration_of_stay,
      arrival_date,
      accommodation_details,
      payment_method
    } = req.body;

    // Find the application
    const eVisaApplication = await EVisa.findByPk(id);
    
    if (!eVisaApplication) {
      const error = new Error('E-Visa application not found.');
      error.status = 404;
      throw error;
    }

    // Check if user is authorized to update this application
    if (!isAdmin && eVisaApplication.userId !== userId) {
      const error = new Error('You are not authorized to update this application.');
      error.status = 403;
      throw error;
    }

    // Prepare update data
    const updateData = {};

    // Update fields if provided
    if (full_name) updateData.full_name = full_name;
    if (gender) updateData.gender = gender;
    if (date_of_birth) updateData.date_of_birth = new Date(date_of_birth);
    if (nationality) updateData.nationality = nationality;
    if (passport_number) updateData.passport_number = passport_number;
    if (passport_expiry) updateData.passport_expiry = new Date(passport_expiry);
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (current_address) updateData.current_address = current_address;
    if (purpose_of_visit_id) {
      // Validate that purpose_of_visit_id exists in visa_types table
      const visaType = await VisaType.findByPk(purpose_of_visit_id);
      if (!visaType) {
        const error = new Error('Invalid purpose of visit ID. Visa type not found.');
        error.status = 400;
        throw error;
      }
      updateData.purpose_of_visit_id = purpose_of_visit_id;
    }
    if (duration_of_stay) updateData.duration_of_stay = duration_of_stay;
    if (arrival_date) updateData.arrival_date = new Date(arrival_date);
    if (accommodation_details) updateData.accommodation_details = accommodation_details;
    if (payment_method) updateData.payment_method = payment_method;

    // Update file paths from uploaded files (if any)
    // Handle image replacement - delete old images when new ones are uploaded
    let filesToDelete = [];
    
    if (req.dbFiles) {
      // Check for new passport copy and mark old one for deletion
      if (req.dbFiles.passportCopy && req.dbFiles.passportCopy.length > 0) {
        if (eVisaApplication.passport_copy) {
          filesToDelete.push(eVisaApplication.passport_copy);
        }
        updateData.passport_copy = req.dbFiles.passportCopy[0];
      }
      
      // Check for new personal photo and mark old one for deletion
      if (req.dbFiles.personalPhoto && req.dbFiles.personalPhoto.length > 0) {
        if (eVisaApplication.personal_photo) {
          filesToDelete.push(eVisaApplication.personal_photo);
        }
        updateData.personal_photo = req.dbFiles.personalPhoto[0];
      }
      
      // Check for new hotel booking and mark old one for deletion
      if (req.dbFiles.hotelBooking && req.dbFiles.hotelBooking.length > 0) {
        if (eVisaApplication.hotel_booking_or_invitation) {
          filesToDelete.push(eVisaApplication.hotel_booking_or_invitation);
        }
        updateData.hotel_booking_or_invitation = req.dbFiles.hotelBooking[0];
      }
      
      // Check for new travel insurance and mark old one for deletion
      if (req.dbFiles.travelInsurance && req.dbFiles.travelInsurance.length > 0) {
        if (eVisaApplication.travel_insurance) {
          filesToDelete.push(eVisaApplication.travel_insurance);
        }
        updateData.travel_insurance = req.dbFiles.travelInsurance[0];
      }
    }

    // If no fields to update, return current data
    if (Object.keys(updateData).length === 0 && filesToDelete.length === 0) {
      // Use the associated visaType data directly
      const visaTypeDetails = eVisaApplication.visaType ? {
        id: eVisaApplication.visaType.id,
        purpose_of_visit_en: eVisaApplication.visaType.purpose_of_visit_en,
        purpose_of_visit_ar: eVisaApplication.visaType.purpose_of_visit_ar,
        fee_amount: eVisaApplication.visaType.fee_amount
      } : null;

      const result = {
        id: eVisaApplication.id,
        userId: eVisaApplication.userId,
        full_name: eVisaApplication.full_name,
        gender: eVisaApplication.gender,
        genderTranslations: eVisaApplication.genderTranslations,
        date_of_birth: eVisaApplication.date_of_birth,
        nationality: eVisaApplication.nationality,
        passport_number: eVisaApplication.passport_number,
        passport_expiry: eVisaApplication.passport_expiry,
        email: eVisaApplication.email,
        phone: eVisaApplication.phone,
        current_address: eVisaApplication.current_address,
        purpose_of_visit: visaTypeDetails,
        duration_of_stay: eVisaApplication.duration_of_stay,
        arrival_date: eVisaApplication.arrival_date,
        accommodation_details: eVisaApplication.accommodation_details,
        passport_copy: eVisaApplication.passport_copy,
        personal_photo: eVisaApplication.personal_photo,
        hotel_booking_or_invitation: eVisaApplication.hotel_booking_or_invitation,
        travel_insurance: eVisaApplication.travel_insurance,
        payment_method: eVisaApplication.payment_method,
        submission_date: eVisaApplication.submission_date,
        createdAt: eVisaApplication.createdAt,
        updatedAt: eVisaApplication.updatedAt
      };

      return res.status(200).json({
        status: "success",
        message: "✅ No changes to update.",
        data: result
      });
    }

    // Delete old files if any
    if (filesToDelete.length > 0) {
      try {
        console.log("🗑️ محاولة حذف الملفات القديمة:", filesToDelete);
        await safeDeleteEVisaFiles(filesToDelete);
      } catch (err) {
        console.error("❌ خطأ أثناء حذف الملفات القديمة:", err);
      }
    }

    // Execute update in database
    const updatedEVisaApplication = await eVisaApplication.update(updateData);

    // Fetch the updated application with visa type information
    const refreshedEVisaApplication = await EVisa.findByPk(updatedEVisaApplication.id, {
      include: [{
        model: VisaType,
        as: 'visaType',
        required: false
      }]
    });

    // Use the associated visaType data directly
    const visaTypeDetails = refreshedEVisaApplication.visaType ? {
      id: refreshedEVisaApplication.visaType.id,
      purpose_of_visit_en: refreshedEVisaApplication.visaType.purpose_of_visit_en,
      purpose_of_visit_ar: refreshedEVisaApplication.visaType.purpose_of_visit_ar,
      fee_amount: refreshedEVisaApplication.visaType.fee_amount
    } : null;

    // Create clean result object
    const result = {
      id: refreshedEVisaApplication.id,
      userId: refreshedEVisaApplication.userId,
      full_name: refreshedEVisaApplication.full_name,
      gender: refreshedEVisaApplication.gender,
      genderTranslations: refreshedEVisaApplication.genderTranslations,
      date_of_birth: refreshedEVisaApplication.date_of_birth,
      nationality: refreshedEVisaApplication.nationality,
      passport_number: refreshedEVisaApplication.passport_number,
      passport_expiry: refreshedEVisaApplication.passport_expiry,
      email: refreshedEVisaApplication.email,
      phone: refreshedEVisaApplication.phone,
      current_address: refreshedEVisaApplication.current_address,
      purpose_of_visit: visaTypeDetails,
      duration_of_stay: refreshedEVisaApplication.duration_of_stay,
      arrival_date: refreshedEVisaApplication.arrival_date,
      accommodation_details: refreshedEVisaApplication.accommodation_details,
      passport_copy: refreshedEVisaApplication.passport_copy,
      personal_photo: refreshedEVisaApplication.personal_photo,
      hotel_booking_or_invitation: refreshedEVisaApplication.hotel_booking_or_invitation,
      travel_insurance: refreshedEVisaApplication.travel_insurance,
      payment_method: refreshedEVisaApplication.payment_method,
      submission_date: refreshedEVisaApplication.submission_date,
      createdAt: refreshedEVisaApplication.createdAt,
      updatedAt: refreshedEVisaApplication.updatedAt
    };

    res.status(200).json({
      status: "success",
      message: "✅ E-Visa application updated successfully.",
      data: result
    });
  } catch (error) {
    // Handle multer errors specifically
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      console.error("Multer error - Unexpected field:", error);
      return res.status(400).json({
        status: "error",
        message: "Unexpected file field. Please check that file field names match: passportCopy, personalPhoto, hotelBooking, travelInsurance",
        error: error.message
      });
    }
    
    // Handle file upload errors
    if (
      error.code &&
      (error.code.startsWith("LIMIT_") ||
        error.code === "INVALID_FILE_TYPE" ||
        error.code === "LIMIT_UNEXPECTED_FILE")
    ) {
      const errorResponse = handleUploadError(error);
      return res.status(errorResponse.statusCode).json(errorResponse);
    }
    
    // Delete newly uploaded files in case of error
    if (req.dbFiles) {
      let newFiles = [];
      
      if (req.dbFiles.passportCopy && req.dbFiles.passportCopy.length > 0) {
        newFiles.push(req.dbFiles.passportCopy[0]);
      }
      if (req.dbFiles.personalPhoto && req.dbFiles.personalPhoto.length > 0) {
        newFiles.push(req.dbFiles.personalPhoto[0]);
      }
      if (req.dbFiles.hotelBooking && req.dbFiles.hotelBooking.length > 0) {
        newFiles.push(req.dbFiles.hotelBooking[0]);
      }
      if (req.dbFiles.travelInsurance && req.dbFiles.travelInsurance.length > 0) {
        newFiles.push(req.dbFiles.travelInsurance[0]);
      }
      
      if (newFiles.length > 0) {
        try {
          await safeDeleteEVisaFiles(newFiles);
          console.log("🗑️ تم حذف الملفات الجديدة بعد فشل العملية");
        } catch (deleteError) {
          console.error("❌ خطأ أثناء حذف الملفات الجديدة:", deleteError);
        }
      }
    }
    
    next(error);
  }
};

// ---------------------------------------------------------
// 🔹 Delete E-Visa application (Users - own applications, Admin - all applications)
// ---------------------------------------------------------
exports.deleteEVisaApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Get user ID from authenticated user
    const userId = req.auth.id;
    const isAdmin = req.auth.isAdmin;

    // Find the application
    const eVisaApplication = await EVisa.findByPk(id);
    
    if (!eVisaApplication) {
      return res.status(404).json({
        status: "failure",
        message: "E-Visa application not found."
      });
    }

    // Check if user is authorized to delete this application
    if (!isAdmin && eVisaApplication.userId !== userId) {
      const error = new Error('You are not authorized to delete this application.');
      error.status = 403;
      throw error;
    }

    // Collect files to delete
    let filesToDelete = [];
    
    // Add all existing files to the deletion list
    if (eVisaApplication.passport_copy) {
      filesToDelete.push(eVisaApplication.passport_copy);
    }
    if (eVisaApplication.personal_photo) {
      filesToDelete.push(eVisaApplication.personal_photo);
    }
    if (eVisaApplication.hotel_booking_or_invitation) {
      filesToDelete.push(eVisaApplication.hotel_booking_or_invitation);
    }
    if (eVisaApplication.travel_insurance) {
      filesToDelete.push(eVisaApplication.travel_insurance);
    }

    // Delete the record from database
    await eVisaApplication.destroy();

    // Delete associated files if any
    if (filesToDelete.length > 0) {
      try {
        console.log("🗑️ حذف ملفات eVisa المرتبطة:", filesToDelete);
        await safeDeleteEVisaFiles(filesToDelete);
      } catch (err) {
        console.error("❌ خطأ أثناء حذف ملفات eVisa:", err);
      }
    }

    // Send final response
    res.status(200).json({
      status: "success",
      message: "🗑️ E-Visa application deleted successfully."
    });
  } catch (error) {
    next(error);
  }
};