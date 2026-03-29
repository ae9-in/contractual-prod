const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

const forgotPasswordLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'forgot-password' });
const resetRequestLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `reset:request:${ip}:${email || 'unknown'}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset requests. Please try later.' },
});
const resetConfirmLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const tokenPrefix = String(req.body?.token || '').trim().slice(0, 12);
    return `reset:confirm:${ip}:${tokenPrefix || 'unknown'}`;
  },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many reset attempts. Please try later.' },
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/password-reset/request', resetRequestLimiter, authController.forgotPassword);
router.post('/password-reset/verify', authController.verifyResetOtp);
router.post('/password-reset/confirm', resetConfirmLimiter, authController.resetPassword);

module.exports = router;
