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
    secure: true,
  });
}

function uploadBufferToCloudinary(file, { folder = 'uploads' } = {}) {
  return new Promise((resolve, reject) => {
    const resourceType = String(file.mimetype || '').startsWith('image/') ? 'image' : 'auto';
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinary.folder || 'contractual'}/${folder}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        return resolve(result);
      },
    );
    upload.end(file.buffer);
  });
}

module.exports = {
  cloudinaryEnabled,
  uploadBufferToCloudinary,
};
