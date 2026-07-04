const jwt = require('jsonwebtoken');
const HttpError = require('../models/errorModel');

const authMiddleware = async (req, res, next) => {
  const bearerHeader = req.headers.authorization; // sempre minúsculo

  if (bearerHeader && bearerHeader.startsWith('Bearer ')) {
    const token = bearerHeader.split(' ')[1];

    jwt.verify(token, process.env.JWT_SECRET, (err, info) => {
      if (err) {
        return next(new HttpError("Unauthorized. Invalid token", 403));
      }

      // info contém { id, name } que você gerou no loginUser
      req.user = info;
      next();
    });
  } else {
    return next(new HttpError("Unauthorized. No token", 403));
  }
};

module.exports = authMiddleware;
