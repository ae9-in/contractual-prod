const asyncHandler = require('../utils/asyncHandler');
const profileService = require('../services/profileService');
const { cacheGet, cacheSet, clearByPrefix } = require('../utils/responseCache');

exports.getProfile = asyncHandler(async (req, res) => {
  const cached = cacheGet(req, 'profile:self');
  if (cached) {
    res.set('Cache-Control', 'private, max-age=15');
    return res.json(cached);
  }
  const profile = await profileService.getProfile(req.user.id);
  const response = { profile };
  cacheSet(req, response, 15000, 'profile:self');
  res.set('Cache-Control', 'private, max-age=15');
  res.json(response);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await profileService.upsertProfile(req.user.id, req.body);
  clearByPrefix('profile:self:');
  res.json({ profile });
});

exports.updateProfilePhoto = asyncHandler(async (req, res) => {
  const profile = await profileService.updateProfilePhoto(req.user.id, req.file);
  clearByPrefix('profile:self:');
  res.json({ profile });
});
