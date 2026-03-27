const express = require('express');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const profileRoutes = require('./routes/profileRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const fileRoutes = require('./routes/fileRoutes');
const paymentController = require('./controllers/paymentController');
const errorHandler = require('./middleware/errorHandler');

const app = express();

if (process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
}

app.use(require('helmet')({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
const corsOptions = env.nodeEnv === 'production'
  ? {
      origin: env.corsOrigins.length ? env.corsOrigins : false,
      credentials: true,
    }
  : {
      origin: true,
      credentials: true,
    };
app.use(cors(corsOptions));
app.use(compression());
app.use(require('morgan')('dev'));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleGatewayWebhook);
app.use(express.json());

const loginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_LOGIN_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_LOGIN_MAX || 30),
  // Shared IPs are common on mobile/carrier networks, so key by IP+email.
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req.ip || req.socket?.remoteAddress || 'unknown');
    const email = String(req.body?.email || '').trim().toLowerCase();
    return `login:${ip}:${email || 'unknown'}`;
  },
  message: { error: 'Too many login attempts. Try again in a few minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

const registerLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REGISTER_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_REGISTER_MAX || 10),
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Slow down.' },
});

if (process.env.NODE_ENV !== 'test') {
  app.use('/api/auth/login', loginLimiter);
  app.use('/api/auth/register', registerLimiter);
  app.use('/api/', generalLimiter);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/files', fileRoutes);

app.use(errorHandler);

module.exports = app;
