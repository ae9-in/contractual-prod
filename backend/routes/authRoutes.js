const express = require('express');
const authController = require('../controllers/authController');
const { createRateLimiter } = require('../middleware/rateLimitMiddleware');

const router = express.Router();

const forgotPasswordLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'forgot-password' });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);

module.exports = router;
