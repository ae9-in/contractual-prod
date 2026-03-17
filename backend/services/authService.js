const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const userModel = require('../models/userModel');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');

const registerSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().min(10).optional().or(z.literal('')),
  password: z.string().min(8),
  role: z.enum(['business', 'freelancer']),
});

const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8),
});

async function register(data) {
  const payload = registerSchema.parse(data);

  const exists = await userModel.findByEmail(payload.email);
  if (exists) {
    throw new ApiError(409, 'Email already exists');
  }

  const passwordHash = await bcrypt.hash(payload.password, 10);
  const user = await userModel.create({ ...payload, passwordHash });

  return user;
}

async function login(data) {
  const payload = loginSchema.parse(data);
  const user = await userModel.findByEmail(payload.email);

  if (!user) {
    throw new ApiError(401, 'Invalid credentials');
  }

  const valid = await bcrypt.compare(payload.password, user.passwordHash);
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
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
  };
}

module.exports = {
  register,
  login,
};
