const path = require('path');
const { cloudinaryEnabled, uploadBufferToCloudinary } = require('../utils/cloudinaryClient');

/**
 * Persist a single uploaded file (already saved to disk by multer).
 * Returns an object with the public URL for the file.
 */
async function persistUploadedFile(file, { folder = '', localRoutePrefix = '/uploads' } = {}) {
    if (!file) return null;

    if (cloudinaryEnabled && file.buffer) {
        const uploaded = await uploadBufferToCloudinary(file, { folder: folder || 'uploads' });
        return {
            url: uploaded.secure_url,
            originalName: file.originalname || path.basename(uploaded.public_id || 'file'),
            size: file.size || 0,
        };
    }

    // multer already saved the file; just build the public URL
    const filename = path.basename(file.path || file.filename);
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
