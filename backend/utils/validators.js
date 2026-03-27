const ApiError = require('./ApiError');

function validateId(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new ApiError(400, 'Invalid identifier');
  }
  return parsed;
}

module.exports = {
  validateId,
};
