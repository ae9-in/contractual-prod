const path = require('path');

function resolveUploadsRoot() {
    return path.join(__dirname, '..', 'uploads');
}

module.exports = { resolveUploadsRoot };
