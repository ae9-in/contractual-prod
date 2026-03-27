const crypto = require('crypto');

function anonymizeIdentifier(value) {
  const safe = String(value || '').trim().toLowerCase();
  if (!safe) return 'anon';
  const digest = crypto.createHash('sha256').update(safe).digest('hex').slice(0, 8);
  return `user[${digest}]`;
}

function securityLog(event, data = {}) {
  const payload = {
    type: 'security_event',
    event,
    at: new Date().toISOString(),
    ...data,
  };
  console.info('[SECURITY]', JSON.stringify(payload));
}

module.exports = {
  anonymizeIdentifier,
  securityLog,
};
