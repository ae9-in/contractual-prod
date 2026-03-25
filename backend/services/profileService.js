const { z } = require('zod');
const profileModel = require('../models/profileModel');
const userModel = require('../models/userModel');
const ApiError = require('../utils/ApiError');
const { persistUploadedFile } = require('./fileStorageService');
const { stripStoredHtml } = require('../utils/sanitizeText');
const { toPublicUrl } = require('../utils/publicFileUrl');

const nullableTrimmedString = (max = 2000) => z.preprocess(
  (value) => {
    if (value == null) return '';
    if (typeof value === 'string') return value.trim();
    return value;
  },
  z.string().max(max).optional().default(''),
);

const optionalUrlSchema = z.preprocess(
  (value) => {
    if (value == null) return '';
    return typeof value === 'string' ? value.trim() : value;
  },
  z.string().url().or(z.literal('')).optional(),
);
const optionalEmailSchema = z.preprocess(
  (value) => {
    if (value == null) return '';
    return typeof value === 'string' ? value.trim().toLowerCase() : value;
  },
  z.string().email().or(z.literal('')).optional(),
);
const optionalPhoneSchema = z.preprocess(
  (value) => {
    if (value == null) return '';
    return typeof value === 'string' ? value.trim() : value;
  },
  z.string().regex(/^[6-9]\d{9}$/, 'Contact phone must be a valid 10-digit Indian mobile number').or(z.literal('')).optional(),
);

const profileSchema = z.object({
  skills: nullableTrimmedString(3000),
  bio: nullableTrimmedString(2000),
  portfolioLink: optionalUrlSchema.default(''),
  experienceYears: z.coerce.number().int().min(0).max(60).optional().default(0),
  profilePhotoUrl: nullableTrimmedString(500),
  organizationName: nullableTrimmedString(150),
  organizationWebsite: optionalUrlSchema.default(''),
  organizationIndustry: nullableTrimmedString(120),
  contactEmail: optionalEmailSchema.default(''),
  contactPhone: optionalPhoneSchema.default(''),
});

function mapProfilePhotoForClient(profile) {
  if (!profile) return profile;
  const url = profile.profilePhotoUrl;
  return {
    ...profile,
    profilePhotoUrl: url ? toPublicUrl(url) : url,
  };
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  const fallbackContactEmail = user?.email || '';
  const fallbackContactPhone = user?.contactPhone || '';
  const profile = await profileModel.getByUserId(userId);
  if (!profile) {
    return {
      userId,
      skills: '',
      bio: '',
      portfolioLink: '',
      experienceYears: 0,
      profilePhotoUrl: '',
      organizationName: '',
      organizationWebsite: '',
      organizationIndustry: '',
      contactEmail: fallbackContactEmail,
      contactPhone: fallbackContactPhone,
    };
  }

  return mapProfilePhotoForClient({
    ...profile,
    contactEmail: String(profile.contactEmail || '').trim() || fallbackContactEmail,
    contactPhone: String(profile.contactPhone || '').trim() || fallbackContactPhone,
  });
}

async function upsertProfile(userId, data) {
  const raw = { ...data };
  if (raw.bio != null) raw.bio = stripStoredHtml(raw.bio);
  if (raw.skills != null) raw.skills = stripStoredHtml(raw.skills);
  if (raw.organizationName != null) raw.organizationName = stripStoredHtml(raw.organizationName);
  if (raw.organizationIndustry != null) raw.organizationIndustry = stripStoredHtml(raw.organizationIndustry);
  const payload = profileSchema.parse(raw);
  const saved = await profileModel.upsertByUserId(userId, payload);
  return mapProfilePhotoForClient(saved);
}

async function updateProfilePhoto(userId, file) {
  if (!file) {
    throw new ApiError(400, 'Profile photo is required');
  }
  const uploaded = await persistUploadedFile(file, {
    folder: 'profile-photos',
    localRoutePrefix: '/uploads/profile-photos',
  });
  const profilePhotoUrl = uploaded.url;
  const saved = await profileModel.updatePhotoByUserId(userId, profilePhotoUrl);
  return mapProfilePhotoForClient(saved);
}

module.exports = {
  getProfile,
  upsertProfile,
  updateProfilePhoto,
};
