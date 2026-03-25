const express = require('express');
const cors = require('cors');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
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

app.use(compression());
app.use(require('helmet')({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(require('morgan')('dev'));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleGatewayWebhook);
app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many attempts. Try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests. Slow down.' },
});

if (process.env.NODE_ENV !== 'test' && process.env.NODE_ENV !== 'development') {
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
  app.use('/api/', generalLimiter);
}

app.get('/health', async (req, res) => {
  let dbStatus = 'ok';
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
  } catch (error) {
    dbStatus = 'unreachable';
  }

  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
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
