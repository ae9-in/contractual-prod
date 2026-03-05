const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const profileRoutes = require('./routes/profileRoutes');
const messageRoutes = require('./routes/messageRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const paymentController = require('./controllers/paymentController');
const errorMiddleware = require('./middleware/errorMiddleware');
const assetAuthMiddleware = require('./middleware/assetAuthMiddleware');
const { resolveUploadsRoot } = require('./utils/uploadsPath');

const app = express();

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
app.use(require('morgan')('dev'));
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), paymentController.handleGatewayWebhook);
app.use(express.json());
app.use('/uploads', assetAuthMiddleware, express.static(resolveUploadsRoot()));

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

app.use(errorMiddleware);

module.exports = app;
