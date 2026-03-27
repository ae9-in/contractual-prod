import api from './api';

export const registerUser = (payload) => api.post('/auth/register', payload);
export const loginUser = (payload) => api.post('/auth/login', payload);
export const forgotPassword = (payload) => api.post('/auth/password-reset/request', payload);
export const verifyResetOtp = (payload) => api.post('/auth/password-reset/verify', payload);
export const resetPassword = (payload) => api.post('/auth/password-reset/confirm', payload);
