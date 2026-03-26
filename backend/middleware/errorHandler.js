const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Global Express error handler — log server-side only; never expose stack, schema paths, or DB internals.
 */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);

  if (err instanceof ZodError || (err && err.name === 'ZodError')) {
    return res.status(400).json({
      error: 'Validation failed. Please check your input.',
    });
  }

  if (err && err.name === 'MulterError') {
    const msgMap = {
      LIMIT_FILE_SIZE: 'Each file must be 10MB or smaller',
      LIMIT_FILE_COUNT: 'You can upload up to 5 files only',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field in upload',
    };
    return res.status(400).json({ error: msgMap[err.code] || 'File upload validation failed' });
  }

  if (err?.message === 'Unsupported file type') {
    return res.status(400).json({ error: 'Unsupported file type. Please upload pdf, doc, xls, zip, image, or txt.' });
  }

  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  return res.status(500).json({
    error: 'Something went wrong. Please try again.',
  });
}

module.exports = errorHandler;
