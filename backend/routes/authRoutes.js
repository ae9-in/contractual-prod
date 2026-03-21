const express = require('express');
const authController = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

const registerLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 12, keyPrefix: 'register' });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: 'login' });
const forgotPasswordLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'forgot-password' });

router.post('/register', registerLimiter, authController.register);
router.post('/login', loginLimiter, authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

module.exports = router;
