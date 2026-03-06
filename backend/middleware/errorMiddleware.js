const { ZodError } = require('zod');
const multer = require('multer');
const ApiError = require('../utils/ApiError');

function errorMiddleware(err, req, res, next) {
  if (err && err.name === 'ZodError') {
    const first = err.issues?.[0];
    const field = first?.path?.length ? first.path.join('.') : 'request';
    const message = first?.message || 'Invalid input';
    return res.status(400).json({
      error: `Validation failed: ${field} - ${message}`,
      details: err.issues,
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

  console.error('[Error Middleware Catch]', err);

  // Try to surface DB connection issues clearly
  if (err && (err.code === 'ECONNREFUSED' || err.code === 'ER_ACCESS_DENIED_ERROR' || err.code === 'ENOTFOUND')) {
    return res.status(500).json({ error: 'Database connection failed. Please check your database credentials and connection status.' });
  }

  return res.status(500).json({
    error: err?.message ? `Internal server error: ${err.message}` : 'Internal server error',
    details: err?.code || 'Unknown'
  });
}

module.exports = errorMiddleware;
