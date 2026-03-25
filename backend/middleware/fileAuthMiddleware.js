const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');

/**
 * Same as authMiddleware but also accepts ?token= for <img src> and other non-AJAX requests.
 */
async function fileAuthMiddleware(req, res, next) {
  const bearer =
    req.headers.authorization && req.headers.authorization.startsWith('Bearer ')
      ? req.headers.authorization.slice(7)
      : '';
  const qToken = String(req.query.token || '').trim();
  const token = bearer || qToken;
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
