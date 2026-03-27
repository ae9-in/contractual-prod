import api from '../services/api';

export async function fetchProtectedAssetObjectUrl(relativePath) {
  const safePath = String(relativePath || '').trim();
  if (!safePath) return '';
  if (/^https?:\/\//i.test(safePath)) return safePath;
  const response = await api.get(safePath.replace(/^\/api/, ''), { responseType: 'blob' });
  return URL.createObjectURL(response.data);
}
