const ApiError = require('../utils/ApiError');

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 10, keyPrefix = 'global' } = {}) {
  const bucket = new Map();

  return (req, _res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();

    const row = bucket.get(key);
    if (!row || now - row.start >= windowMs) {
      bucket.set(key, { count: 1, start: now });
      return next();
    }

    row.count += 1;
    bucket.set(key, row);
    if (row.count > max) {
      return next(new ApiError(429, 'Too many requests. Please try again later.'));
    }

    return next();
  };
}

module.exports = { createRateLimiter };

