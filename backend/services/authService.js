const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const userModel = require('../models/userModel');
const passwordResetTokenModel = require('../models/passwordResetTokenModel');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const { invalidateCachedUsers } = require('../middleware/authMiddleware');
const passwordResetNotifier = require('./passwordResetNotifier');
const { anonymizeIdentifier, securityLog } = require('../utils/securityLogger');

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
});
const verifyResetOtpSchema = z.object({
  token: z.string().trim().min(32),
  otp: z.string().trim().regex(/^\d{6}$/),
});
const resetPasswordSchema = z.object({
  token: z.string().trim().min(32),
  newPassword: z.string().min(8),
});

function normalizePassword(raw) {
  if (typeof raw !== 'string') return '';
  // Canonicalize unicode + trim accidental leading/trailing spaces.
  return raw.normalize('NFKC').trim();
}

function validatePasswordStrength(password) {
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  if (!hasUpper || !hasNumber || !hasSpecial) {
    throw new ApiError(
      400,
      'Password must contain at least one uppercase letter, one number, and one special character.',
    );
  }
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

async function register(data, meta = {}) {
  const payload = registerSchema.parse(data);
  const normalizedPassword = normalizePassword(payload.password);
  if (normalizedPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  validatePasswordStrength(normalizedPassword);

  const exists = await userModel.findByEmail(payload.email);
  if (exists) {
    securityLog('register_failure', {
      identifier: anonymizeIdentifier(payload.email),
      reason: 'email_exists',
      ip: meta.ip,
      requestId: meta.requestId,
    });
    throw new ApiError(409, 'Registration could not be completed. Please check your details.');
  }

  const passwordHash = await bcrypt.hash(normalizedPassword, 10);
  let user;
  try {
    user = await userModel.create({ ...payload, passwordHash });
  } catch (error) {
    // Handle race conditions where another request created the same email.
    if (error?.code === '23505' || error?.code === 'ER_DUP_ENTRY') {
      securityLog('register_failure', {
        identifier: anonymizeIdentifier(payload.email),
        reason: 'email_exists_race',
        ip: meta.ip,
        requestId: meta.requestId,
      });
      throw new ApiError(409, 'Registration could not be completed. Please check your details.');
    }
    throw error;
  }

  return user;
}

async function login(data, meta = {}) {
  const payload = loginSchema.parse(data);
  const normalizedPassword = normalizePassword(payload.password);
  if (normalizedPassword.length < 8) {
    throw new ApiError(401, 'Invalid credentials');
  }
  const users = await userModel.findByEmailCandidates(payload.email);
  if (!users.length) {
    securityLog('login_failure', {
      identifier: anonymizeIdentifier(payload.email),
      reason: 'not_found',
      ip: meta.ip,
      requestId: meta.requestId,
    });
    throw new ApiError(401, 'Invalid credentials');
  }

  const passwordCandidates = [normalizedPassword];
  let matchedUser = null;

  // Try against each normalized-email match; handles duplicate rows from imperfect migrations.
  for (const user of users) {
    if (!user || typeof user.passwordHash !== 'string') continue;
    const normalizedHash = normalizeBcryptHash(user.passwordHash);
    if (!normalizedHash) continue;

    for (const candidate of passwordCandidates) {
      try {
        // eslint-disable-next-line no-await-in-loop
        const valid = await bcrypt.compare(candidate, normalizedHash);
        if (valid) {
          matchedUser = user;
          break;
        }
      } catch {
        securityLog('login_failure', {
          identifier: anonymizeIdentifier(payload.email),
          reason: 'hash_compare_error',
          ip: meta.ip,
          requestId: meta.requestId,
        });
      }
    }
    if (matchedUser) {
      break;
    }
  }
  if (!matchedUser) {
    securityLog('login_failure', {
      identifier: anonymizeIdentifier(payload.email),
      reason: 'invalid_password',
      ip: meta.ip,
      requestId: meta.requestId,
    });
    throw new ApiError(401, 'Invalid credentials');
  }
  securityLog('login_success', { userId: matchedUser.id, ip: meta.ip, requestId: meta.requestId });

  const token = jwt.sign(
    {
      sub: matchedUser.id,
      role: matchedUser.role,
      email: matchedUser.email,
      name: matchedUser.name,
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn },
  );

  return {
    token,
    user: {
      id: matchedUser.id,
      name: matchedUser.name,
      email: matchedUser.email,
      contactPhone: matchedUser.contactPhone,
      role: matchedUser.role,
    },
  };
}

async function forgotPassword(data, meta = {}) {
  const payload = forgotPasswordSchema.parse(data);
  const generic = { success: true, message: 'If an account exists, you will receive a reset code.' };
  const user = await userModel.findByEmail(payload.email);
  if (!user) {
    securityLog('password_reset_requested', {
      identifier: anonymizeIdentifier(payload.email),
      result: 'not_found',
      ip: meta.ip,
      requestId: meta.requestId,
    });
    // Keep timing closer to existing-account path.
    await new Promise((resolve) => setTimeout(resolve, 120));
    return generic;
  }
  const rawToken = crypto.randomBytes(32).toString('hex');
  const otp = crypto.randomInt(100000, 1000000).toString();
  const tokenHash = await bcrypt.hash(rawToken, 10);
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const tokenPrefix = rawToken.slice(0, 12);

  await passwordResetTokenModel.clearActiveByUserId(user.id);
  await passwordResetTokenModel.create({
    userId: user.id,
    tokenPrefix,
    tokenHash,
    otpHash,
    expiresAt,
  });
  await passwordResetNotifier.sendPasswordResetOtp({ email: user.email, otp });
  securityLog('password_reset_requested', {
    userId: user.id,
    identifier: anonymizeIdentifier(user.email),
    ip: meta.ip,
    requestId: meta.requestId,
  });
  return {
    success: true,
    message: generic.message,
    token: rawToken,
  };
}

async function resolveActiveResetToken(rawToken) {
  const token = String(rawToken || '').trim();
  const tokenPrefix = token.slice(0, 12);
  if (!token || token.length < 32 || !tokenPrefix) return null;
  const rows = await passwordResetTokenModel.listActiveByTokenPrefix(tokenPrefix);
  for (const row of rows) {
    if (row.attempts >= 5) continue;
    try {
      // eslint-disable-next-line no-await-in-loop
      const valid = await bcrypt.compare(token, row.tokenHash);
      if (valid) return row;
    } catch {
      securityLog('password_reset_requested', { reason: 'malformed_token_hash' });
    }
  }
  return null;
}

async function verifyResetOtp(data, meta = {}) {
  const payload = verifyResetOtpSchema.parse(data);
  const tokenRow = await resolveActiveResetToken(payload.token);
  if (!tokenRow || tokenRow.usedAt || new Date(tokenRow.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(400, 'Invalid or expired code');
  }
  if (tokenRow.attempts >= 5) {
    securityLog('password_reset_lockout', { userId: tokenRow.userId, ip: meta.ip, requestId: meta.requestId });
    throw new ApiError(429, 'Too many attempts');
  }

  let validOtp = false;
  try {
    validOtp = await bcrypt.compare(payload.otp, tokenRow.otpHash);
  } catch {
    validOtp = false;
  }
  if (!validOtp) {
    await passwordResetTokenModel.incrementAttempts(tokenRow.id);
    throw new ApiError(400, 'Invalid or expired code');
  }
  return { success: true, message: 'Code verified' };
}

async function resetPasswordWithToken(data, meta = {}) {
  const payload = resetPasswordSchema.parse(data);
  const normalizedNewPassword = normalizePassword(payload.newPassword);
  if (normalizedNewPassword.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  validatePasswordStrength(normalizedNewPassword);

  const tokenRow = await resolveActiveResetToken(payload.token);
  if (!tokenRow || tokenRow.usedAt || new Date(tokenRow.expiresAt).getTime() <= Date.now()) {
    throw new ApiError(400, 'Invalid or expired token');
  }
  if (tokenRow.attempts >= 5) {
    securityLog('password_reset_lockout', { userId: tokenRow.userId, ip: meta.ip, requestId: meta.requestId });
    throw new ApiError(429, 'Too many attempts');
  }

  const passwordHash = await bcrypt.hash(normalizedNewPassword, 10);
  const updated = await userModel.updatePasswordByUserId(tokenRow.userId, passwordHash);
  if (!updated) {
    throw new ApiError(400, 'Invalid or expired token');
  }
  await passwordResetTokenModel.markUsed(tokenRow.id);
  invalidateCachedUsers([tokenRow.userId]);
  securityLog('password_reset_completed', { userId: tokenRow.userId, ip: meta.ip, requestId: meta.requestId });
  return { success: true };
}

module.exports = {
  register,
  login,
  forgotPassword,
  verifyResetOtp,
  resetPasswordWithToken,
};
