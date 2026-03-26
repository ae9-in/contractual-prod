import axios from 'axios';
import { getStoredToken } from '../utils/authStorage';

const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config || {};
    const retriable = !error?.response || error.response.status >= 500;
    const maxRetries = 2;
    config.__retryCount = config.__retryCount || 0;

    if (retriable && config.__retryCount < maxRetries) {
      config.__retryCount += 1;
      const backoffMs = 250 * (2 ** (config.__retryCount - 1));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return api.request(config);
    }

    throw error;
  },
);

export default api;
