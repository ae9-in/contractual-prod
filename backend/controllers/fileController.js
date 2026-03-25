const path = require('path');
const fs = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const projectModel = require('../models/projectModel');
const { resolveUploadsRoot } = require('../utils/uploadsPath');

function resolveUploadAbsolutePath(filename) {
  const root = resolveUploadsRoot();
  const subdirs = ['submissions', 'project-references', 'profile-photos'];
  for (const dir of subdirs) {
    const candidate = path.join(root, dir, filename);
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

exports.getUploadedFile = asyncHandler(async (req, res) => {
  const raw = req.params.filename;
  const filename = path.basename(String(raw || ''));
  if (!filename || filename !== String(raw) || filename.includes('..')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const allowed = await projectModel.userMayAccessUploadedFile(filename, req.user.id);
  if (!allowed) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const abs = resolveUploadAbsolutePath(filename);
  if (!abs) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.sendFile(abs);
});
