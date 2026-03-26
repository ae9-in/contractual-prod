const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const userModel = require('../models/userModel');
const projectModel = require('../models/projectModel');
const { sameUserId } = require('../utils/sameUserId');

let io;
const accessCache = new Map();
const ACCESS_TTL_MS = 30 * 1000;

async function canJoinProject(projectId, userId) {
  const key = `${Number(projectId)}:${Number(userId)}`;
  const cached = accessCache.get(key);
  if (cached && (Date.now() - cached.at) < ACCESS_TTL_MS) {
    return cached.allowed;
  }
  const project = await projectModel.findById(Number(projectId));
  if (!project) {
    accessCache.set(key, { allowed: false, at: Date.now() });
    return false;
  }
  const allowed = sameUserId(project.businessId, userId) || sameUserId(project.freelancerId, userId);
  accessCache.set(key, { allowed, at: Date.now() });
  return allowed;
}

function initRealtime(server) {
  io = new Server(server, {
    cors: {
      origin: env.nodeEnv === 'production' ? (env.corsOrigins.length ? env.corsOrigins : false) : true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = jwt.verify(token, env.jwtSecret);
      const user = await userModel.findById(payload.sub);
      if (!user) {
        return next(new Error('Unauthorized'));
      }

      socket.user = {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
      };

      return next();
    } catch {
      return next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user.id}`);

    socket.on('project:join', async (projectId, ack) => {
      const allowed = await canJoinProject(projectId, socket.user.id);
      if (!allowed) {
        if (typeof ack === 'function') ack({ ok: false, error: 'Forbidden' });
        return;
      }

      socket.join(`project:${Number(projectId)}`);
      if (typeof ack === 'function') ack({ ok: true });
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${Number(projectId)}`);
    });

    socket.on('project:typing', async (payload) => {
      const projectId = Number(payload?.projectId);
      const isTyping = Boolean(payload?.isTyping);
      if (!projectId) return;

      const allowed = await canJoinProject(projectId, socket.user.id);
      if (!allowed) return;

      socket.to(`project:${projectId}`).emit('project:typing', {
        projectId,
        userId: socket.user.id,
        userName: socket.user.name,
        isTyping,
      });
    });
  });

  return io;
}

function getIo() {
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${Number(userId)}`).emit(event, payload);
}

function emitToProject(projectId, event, payload) {
  if (!io) return;
  io.to(`project:${Number(projectId)}`).emit(event, payload);
}

module.exports = {
  initRealtime,
  getIo,
  emitToUser,
  emitToProject,
};
