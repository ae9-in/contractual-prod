const MAX_CACHE_ENTRIES = Number(process.env.RESPONSE_CACHE_MAX || 500);

const store = new Map();

function prune() {
  if (store.size <= MAX_CACHE_ENTRIES) return;
  const oldestKey = store.keys().next().value;
  if (oldestKey) store.delete(oldestKey);
}

function buildKey(req, keyPrefix = 'cache') {
  const userPart = req.user?.id != null ? `u:${req.user.id}` : 'u:anon';
  return `${keyPrefix}:${userPart}:${req.originalUrl}`;
}

function cacheGet(req, keyPrefix = 'cache') {
  const key = buildKey(req, keyPrefix);
  const row = store.get(key);
  if (!row) return null;
  if (Date.now() > row.expiresAt) {
    store.delete(key);
    return null;
  }
  return row.payload;
}

function cacheSet(req, payload, ttlMs = 5000, keyPrefix = 'cache') {
  const key = buildKey(req, keyPrefix);
  store.set(key, { payload, expiresAt: Date.now() + ttlMs });
  prune();
}

function clearByPrefix(prefix) {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}

module.exports = {
  cacheGet,
  cacheSet,
  clearByPrefix,
};

