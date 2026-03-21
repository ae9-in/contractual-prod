const TOKEN_KEY = 'token';
const USER_KEY = 'user';

function safeRead(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(storage, key, value) {
  try {
    storage.setItem(key, value);
  } catch {
    // ignore storage failures
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    // ignore storage failures
  }
}

function migrateLegacyAuthToSession() {
  const existingSessionToken = safeRead(sessionStorage, TOKEN_KEY);
  const existingSessionUser = safeRead(sessionStorage, USER_KEY);
  if (existingSessionToken || existingSessionUser) return;

  const legacyToken = safeRead(localStorage, TOKEN_KEY);
  const legacyUser = safeRead(localStorage, USER_KEY);
  if (!legacyToken && !legacyUser) return;

  if (legacyToken) safeWrite(sessionStorage, TOKEN_KEY, legacyToken);
  if (legacyUser) safeWrite(sessionStorage, USER_KEY, legacyUser);
}

export function getStoredToken() {
  migrateLegacyAuthToSession();
  return safeRead(sessionStorage, TOKEN_KEY);
}

export function getStoredUserRaw() {
  migrateLegacyAuthToSession();
  return safeRead(sessionStorage, USER_KEY);
}

export function setStoredAuth(token, user) {
  // Keep auth state in session scope only.
  safeRemove(localStorage, TOKEN_KEY);
  safeRemove(localStorage, USER_KEY);
  safeWrite(sessionStorage, TOKEN_KEY, token);
  safeWrite(sessionStorage, USER_KEY, JSON.stringify(user));
}

export function clearStoredAuth() {
  safeRemove(sessionStorage, TOKEN_KEY);
  safeRemove(sessionStorage, USER_KEY);
  // Remove any legacy localStorage auth to prevent silent re-hydration after logout.
  safeRemove(localStorage, TOKEN_KEY);
  safeRemove(localStorage, USER_KEY);
}

