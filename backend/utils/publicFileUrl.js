const path = require('path');

/**
 * Convert internal upload paths to API URLs (never expose raw filesystem paths to clients).
 */
function toPublicUrl(internalPath) {
  if (internalPath == null || internalPath === '') return internalPath;
  const s = String(internalPath).trim();
  const filename = s.split('/').pop() || s;
  if (!filename) return '/api/files/';
  return `/api/files/${filename}`;
}

function mapFileRefs(value) {
  if (!value) return [];
  const arr = Array.isArray(value) ? value : [];
  return arr.map((item) => {
    if (typeof item === 'string') {
      return { url: toPublicUrl(item), originalName: path.basename(item), size: 0 };
    }
    if (item && typeof item === 'object') {
      const url = item.url != null ? toPublicUrl(item.url) : '';
      return { ...item, url };
    }
    return item;
  });
}

module.exports = { toPublicUrl, mapFileRefs };
