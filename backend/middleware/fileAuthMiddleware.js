const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');

/**
 * File auth must use Authorization header only.
 */
async function fileAuthMiddleware(req, res, next) {
  const bearer =
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : '';
  const token = bearer;
  if (!token) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = await userModel.findById(payload.sub);
    if (!user) {
      return next(new ApiError(401, 'Unauthorized'));
    }
    req.user = {
      id: user.id,
      role: user.role,
      email: user.email,
      name: user.name,
      businessId: user.role === 'business' ? user.id : null,
    };
    return next();
  } catch {
    return next(new ApiError(401, 'Unauthorized'));
  }
}

module.exports = fileAuthMiddleware;
