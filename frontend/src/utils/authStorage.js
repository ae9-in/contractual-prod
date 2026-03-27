let memoryToken = '';
let memoryUserRaw = '';

export function getStoredToken() {
  return memoryToken || null;
}

export function getStoredUserRaw() {
  return memoryUserRaw || null;
}

export function setStoredAuth(token, user) {
  memoryToken = String(token || '');
  memoryUserRaw = JSON.stringify(user || null);
}

export function clearStoredAuth() {
  memoryToken = '';
  memoryUserRaw = '';
}

