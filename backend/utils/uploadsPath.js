const os = require('os');
const path = require('path');

function resolveUploadsRoot() {
  // Vercel serverless runtime only guarantees write access in /tmp.
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'contractual-uploads');
  }
  return path.join(process.cwd(), 'uploads');
}

module.exports = {
  resolveUploadsRoot,
};

