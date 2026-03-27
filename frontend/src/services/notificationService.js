import api from './api';

export const getNotifications = (params) => api.get('/notifications', { params });
export const getUnreadProjectNotifications = () => api.get('/notifications/unread-projects');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');
