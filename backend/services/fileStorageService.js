const fs = require('fs');
const path = require('path');
const { v2: cloudinary } = require('cloudinary');
const env = require('../config/env');

const cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret,
);

if (cloudinaryEnabled) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

async function cleanupLocalTempFile(filePath) {
  if (!filePath) return;
  try {
    await fs.promises.unlink(filePath);
  } catch {
    // Best effort cleanup only.
  }
}

function buildLocalFileUrl(localRoutePrefix, fileName) {
  return `${localRoutePrefix}/${encodeURIComponent(fileName)}`;
}

async function persistUploadedFile(file, { folder, localRoutePrefix }) {
  if (!file) return null;

  if (!cloudinaryEnabled) {
    return {
      name: file.originalname,
      url: buildLocalFileUrl(localRoutePrefix, file.filename),
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  const folderName = path.posix.join(env.cloudinary.folder, folder);
  const uploadResult = await cloudinary.uploader.upload(file.path, {
    folder: folderName,
    resource_type: 'auto',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
  });

  await cleanupLocalTempFile(file.path);

  return {
    name: file.originalname,
    url: uploadResult.secure_url,
    size: file.size,
    mimeType: file.mimetype,
  };
}

async function persistUploadedFiles(files, options) {
  const list = Array.isArray(files) ? files : [];
  const uploaded = await Promise.all(list.map((file) => persistUploadedFile(file, options)));
  return uploaded.filter(Boolean);
}

module.exports = {
  cloudinaryEnabled,
  persistUploadedFile,
  persistUploadedFiles,
};

