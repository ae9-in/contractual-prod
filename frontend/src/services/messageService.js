import api from './api';

export const getProjectMessages = (projectId, params) => api.get(`/messages/projects/${projectId}`, { params });
export const sendProjectMessage = (projectId, payload) => api.post(`/messages/projects/${projectId}`, payload);
