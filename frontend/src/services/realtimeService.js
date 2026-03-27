import { io } from 'socket.io-client';
import { getStoredToken } from '../utils/authStorage';

let socket;

const API_URL = import.meta.env.VITE_API_URL;
if (!API_URL && import.meta.env.MODE === 'production') {
  throw new Error('VITE_API_URL is required');
}

export function connectRealtime() {
  const token = getStoredToken();
  if (!token) return null;

  if (socket?.connected) return socket;

  if (socket) {
    socket.auth = { token };
    socket.connect();
    return socket;
  }

  socket = io(API_URL, {
    autoConnect: true,
    transports: import.meta.env.MODE === 'production' ? ['websocket'] : ['websocket', 'polling'],
    auth: { token },
  });

  return socket;
}

export function disconnectRealtime() {
  if (!socket) return;
  socket.disconnect();
}

export function getRealtimeSocket() {
  return socket;
}

export function onRealtime(event, handler) {
  if (!socket) return () => {};
  socket.on(event, handler);
  return () => socket.off(event, handler);
}

export function emitRealtime(event, payload, ack) {
  if (!socket) return;
  socket.emit(event, payload, ack);
}

export function joinProjectRoom(projectId, ack) {
  emitRealtime('project:join', Number(projectId), ack);
}

export function leaveProjectRoom(projectId) {
  emitRealtime('project:leave', Number(projectId));
}

export function setProjectTyping(projectId, isTyping) {
  emitRealtime('project:typing', { projectId: Number(projectId), isTyping: Boolean(isTyping) });
}
