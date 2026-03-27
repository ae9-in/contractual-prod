const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const userModel = require('../models/userModel');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
  contactPhone: z.string().trim().regex(/^\d{10}$/, 'Contact phone must be a valid 10-digit number'),
  role: z.enum(['business', 'freelancer']),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
});
const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  contactPhone: z.string().trim().regex(/^\d{10}$/, 'Contact phone must be a valid 10-digit number'),
  newPassword: z.string().min(8),
});

function normalizePassword(raw) {
  if (typeof raw !== 'string') return '';
  // Canonicalize unicode + trim accidental leading/trailing spaces.
  return raw.normalize('NFKC').trim();
}

function normalizeBcryptHash(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let hash = raw.trim();
  if (
    (hash.startsWith('"') && hash.endsWith('"'))
    || (hash.startsWith("'") && hash.endsWith("'"))
  ) {
    hash = hash.slice(1, -1).trim();
  }
  // Imported datasets from other stacks sometimes store bcrypt as $2y$ / $2x$.
  if (hash.startsWith('$2y$')) return `$2b$${hash.slice(4)}`;
  if (hash.startsWith('$2x$')) return `$2b$${hash.slice(4)}`;
  return hash;
}

async function register(data) {
  const payload = registerSchema.parse(data);
  const normalizedPassword = normalizePassword(payload.password);
  if (normalizedPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const exists = await userModel.findByEmail(payload.email);
  if (exists) {
    throw new ApiError(409, 'Email already exists');
  }

  const existingPhone = await userModel.findByPhone(payload.contactPhone);
  if (existingPhone) {
    throw new ApiError(409, 'Contact phone already exists');
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  const user = await userModel.create({ ...payload, passwordHash });

  return user;
}

async function login(data) {
  const payload = loginSchema.parse(data);
  const normalizedPassword = normalizePassword(payload.password);
  if (normalizedPassword.length < 8) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const user = await userModel.findByEmail(payload.email);

  if (!user || !user.passwordHash || typeof user.passwordHash !== 'string') {
    throw new ApiError(401, 'Invalid credentials');
  }

  const normalizedHash = normalizeBcryptHash(user.passwordHash);
  if (!normalizedHash) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordCandidates = [normalizedPassword];

  let valid = false;
  for (const candidate of passwordCandidates) {
    try {
      // eslint-disable-next-line no-await-in-loop
      valid = await bcrypt.compare(candidate, normalizedHash);
      if (valid) break;
    } catch {
      // Corrupted/non-bcrypt hashes should not surface as 500.
      throw new ApiError(401, 'Invalid credentials');
    }
  }
  if (!valid) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const token = jwt.sign(
    { sub: user.id, role: user.role, email: user.email, name: user.name },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return {
    token,
    user: { id: user.id, name: user.name, email: user.email, contactPhone: user.contactPhone, role: user.role },
  };
}

async function forgotPassword(data) {
  const payload = forgotPasswordSchema.parse(data);
  const normalizedNewPassword = normalizePassword(payload.newPassword);
  if (normalizedNewPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  const passwordHash = await bcrypt.hash(normalizedNewPassword, 10);
  await userModel.updatePasswordByEmailAndPhone(
    payload.email,
    payload.contactPhone,
    passwordHash,
  );

  return { success: true };
}

module.exports = {
  register,
  login,
  forgotPassword,
};
