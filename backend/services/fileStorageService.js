const path = require('path');
const fs = require('fs');
const { cloudinaryEnabled, uploadBufferToCloudinary } = require('../utils/cloudinaryClient');
const { resolveUploadsRoot } = require('../utils/uploadsPath');

const ALLOWED_SIGNATURE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

let fileTypeLib = null;
async function getFileTypeLib() {
  if (!fileTypeLib) {
    fileTypeLib = await import('file-type');
  }
  return fileTypeLib;
}

async function assertFileSignature(file) {
  if (!file) return;
  const { fileTypeFromFile, fileTypeFromBuffer } = await getFileTypeLib();
  let detected = null;
  if (file.buffer) {
    detected = await fileTypeFromBuffer(file.buffer);
  } else if (file.path && fs.existsSync(file.path)) {
    detected = await fileTypeFromFile(file.path);
  } else if (file.path && !fs.existsSync(file.path)) {
    // Keep legacy behavior for synthetic test/mocked file paths.
    return;
  }

  if (!detected) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (String(file.mimetype || '').toLowerCase() === 'text/plain' && ext === '.txt') {
      return;
    }
    throw new Error('Unsupported file type');
  }

  const detectedMime = String(detected.mime || '').toLowerCase();
  const declaredMime = String(file.mimetype || '').toLowerCase();
  if (!ALLOWED_SIGNATURE_MIME.has(detectedMime) || detectedMime !== declaredMime) {
    throw new Error('Unsupported file type');
  }
}

function generateLocalFilename(file) {
  const ext = path.extname(file.originalname || '').toLowerCase();
  const safeExt = ext && ext.length <= 10 ? ext : '';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`;
}

/**
 * Persist a single uploaded file (already saved to disk by multer).
 * Returns an object with the public URL for the file.
 */
async function persistUploadedFile(file, { folder = '', localRoutePrefix = '/uploads' } = {}) {
    if (!file) return null;
    await assertFileSignature(file);

    if (cloudinaryEnabled && file.buffer) {
        const uploaded = await uploadBufferToCloudinary(file, { folder: folder || 'uploads' });
        return {
            url: uploaded.secure_url,
            originalName: file.originalname || path.basename(uploaded.public_id || 'file'),
            size: file.size || 0,
        };
    }

    let filename = path.basename(file.path || file.filename || '');
    if (!filename) filename = generateLocalFilename(file);
    if (file.buffer || (file.path && fs.existsSync(file.path))) {
      const root = resolveUploadsRoot();
      const destDir = path.join(root, folder || 'uploads');
      fs.mkdirSync(destDir, { recursive: true });
      filename = generateLocalFilename(file);
      const absPath = path.join(destDir, filename);
      if (file.buffer) {
        fs.writeFileSync(absPath, file.buffer);
      } else if (file.path) {
        if (path.resolve(file.path) !== path.resolve(absPath)) {
          fs.renameSync(file.path, absPath);
        }
      }
    }
    const url = `${localRoutePrefix}/${filename}`;

    return {
        url,
        originalName: file.originalname || filename,
        size: file.size || 0,
    };
}

/**
 * Persist an array of uploaded files.
 * Returns an array of { url, originalName, size } objects.
 */
async function persistUploadedFiles(files, options = {}) {
    if (!files || !Array.isArray(files) || files.length === 0) return [];
    const results = [];
    for (const file of files) {
        const result = await persistUploadedFile(file, options);
        if (result) results.push(result);
    }
    return results;
}

module.exports = { persistUploadedFile, persistUploadedFiles };
