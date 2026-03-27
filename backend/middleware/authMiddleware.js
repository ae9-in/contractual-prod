const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');

const AUTH_USER_CACHE_TTL_MS = Number(process.env.AUTH_USER_CACHE_TTL_MS || 30000);
const authUserCache = new Map();

function getCachedUser(userId) {
  const key = String(userId);
  const row = authUserCache.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    authUserCache.delete(key);
    return null;
  }
  return row.user;
}

function setCachedUser(userId, user) {
  authUserCache.set(String(userId), {
    user,
    expiresAt: Date.now() + AUTH_USER_CACHE_TTL_MS,
  });
}

function invalidateCachedUser(userId) {
  authUserCache.delete(String(userId));
}

function invalidateCachedUsers(userIds = []) {
  userIds.forEach((id) => invalidateCachedUser(id));
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Unauthorized'));
  }

  try {
    const token = authHeader.slice(7);
    const payload = jwt.verify(token, env.jwtSecret);
    let user = getCachedUser(payload.sub);
    if (!user) {
      user = await userModel.findById(payload.sub);
      if (user) setCachedUser(payload.sub, user);
    }

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
  } catch (error) {
    return next(new ApiError(401, 'Unauthorized'));
  }
}

module.exports = authMiddleware;
module.exports.invalidateCachedUser = invalidateCachedUser;
module.exports.invalidateCachedUsers = invalidateCachedUsers;
