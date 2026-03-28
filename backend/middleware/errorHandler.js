const { ZodError } = require('zod');
const ApiError = require('../utils/ApiError');

/**
 * Global Express error handler — log server-side only; never expose stack, schema paths, or DB internals.
 */
function errorHandler(err, req, res, next) {
  const logPayload = {
    requestId: req?.id || 'unknown',
    message: err?.message || 'Unknown error',
    code: err?.code || err?.statusCode || 'ERR_UNKNOWN',
    status: err?.statusCode || 500,
    at: new Date().toISOString(),
  };
  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', logPayload, err?.stack || '');
  } else {
    console.error('[ERROR]', logPayload);
  }

  if (err instanceof ZodError || (err && err.name === 'ZodError')) {
    const fieldErrors = {};
    const issues = Array.isArray(err.issues) ? err.issues : [];
    for (const issue of issues) {
      const key = String(issue?.path?.[0] || '').trim();
      if (!key || fieldErrors[key]) continue;
      fieldErrors[key] = String(issue?.message || 'Invalid value');
    }
    return res.status(400).json({
      error: 'Validation failed. Please check your input.',
      fieldErrors,
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

  const response = {
    error: 'Something went wrong. Please try again.',
  };
  if (process.env.NODE_ENV !== 'production') {
    response.debug = {
      message: err?.message,
      code: err?.code,
      stack: err?.stack,
    };
  }

  return res.status(500).json(response);
}

module.exports = errorHandler;
