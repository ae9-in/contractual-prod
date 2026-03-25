const sanitizeHtml = require('sanitize-html');

const strict = { allowedTags: [], allowedAttributes: {} };

function stripStoredHtml(input) {
  if (input == null) return '';
  return sanitizeHtml(String(input), strict);
}

module.exports = { stripStoredHtml };
