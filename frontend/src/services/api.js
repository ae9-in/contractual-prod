import axios from 'axios';
import { getStoredToken } from '../utils/authStorage';

const GET_CACHE_TTL_MS = 8000;
const getCache = new Map();
const baseApiUrl = import.meta.env.VITE_API_URL;
if (!baseApiUrl && import.meta.env.MODE === 'production') {
  throw new Error('VITE_API_URL is required');
}

const api = axios.create({
  baseURL: `${baseApiUrl || ''}/api`,
  timeout: 15000,
});

if (import.meta.env.MODE !== 'production' || baseApiUrl?.includes('localhost') || baseApiUrl?.includes('127.0.0.1')) {
  console.log('[API] Initialized with baseURL:', api.defaults.baseURL);
}

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  const isGet = String(config.method || 'get').toLowerCase() === 'get';
  if (!isGet) return config;

  const key = `${config.baseURL || ''}|${config.url || ''}|${JSON.stringify(config.params || {})}|${token || ''}`;
  const cached = getCache.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    config.adapter = async () => ({
      data: cached.data,
      status: 200,
      statusText: 'OK',
      headers: {},
      config,
      request: {},
    });
  } else if (cached) {
    getCache.delete(key);
  }

  config.metadata = { ...(config.metadata || {}), cacheKey: key, isGet };
  return config;
});

api.interceptors.response.use(
  (response) => {
    const key = response?.config?.metadata?.cacheKey;
    const isGet = response?.config?.metadata?.isGet;
    if (isGet && key) {
      getCache.set(key, {
        data: response.data,
        expiresAt: Date.now() + GET_CACHE_TTL_MS,
      });
      if (getCache.size > 200) {
        const firstKey = getCache.keys().next().value;
        if (firstKey) getCache.delete(firstKey);
      }
    }
    return response;
  },
  async (error) => {
    const config = error?.config || {};
    const requestUrl = String(config.url || '');
    const isAuthRequest = requestUrl.includes('/auth/login')
      || requestUrl.includes('/auth/register')
      || requestUrl.includes('/auth/forgot-password');
    const retriable = !error?.response || error.response.status >= 500;
    const maxRetries = 2;
    config.__retryCount = config.__retryCount || 0;

    if (!isAuthRequest && retriable && config.__retryCount < maxRetries) {
      config.__retryCount += 1;
      const backoffMs = 250 * (2 ** (config.__retryCount - 1));
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return api.request(config);
    }

    console.error('[WARN] api request failed:', error?.message || 'unknown');
    throw error;
  },
);

export default api;
