const mongoose = require("mongoose");

function deriveOwnerAdminId(req) {
  const isAdmin = req.auth?.isAdmin;
  const id = req.auth?.id;
  const ownerAdminId = isAdmin ? id : req.auth?.ownerAdminId;
  return ownerAdminId;
}

// يشتق owner_admin من JWT ويضعه على req.ownerAdminId
exports.requireTenant = function (req, res, next) {
  try {
    const ownerAdminId = deriveOwnerAdminId(req);
    if (!ownerAdminId || !mongoose.Types.ObjectId.isValid(ownerAdminId)) {
      const err = new Error("Unauthorized");
      err.status = 401;
      throw err;
    }
    req.ownerAdminId = ownerAdminId;
    next();
  } catch (e) {
    next(e);
  }
};

// ينظف owner_admin من body و query لمنع التلاعب
exports.sanitizeOwnerAdmin = function (req, res, next) {
  if (req.body && Object.prototype.hasOwnProperty.call(req.body, "owner_admin")) {
    delete req.body.owner_admin;
  }
  if (req.query && Object.prototype.hasOwnProperty.call(req.query, "owner_admin")) {
    delete req.query.owner_admin;
  }
  next();
};


