const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

function requestMeta(req) {
  return {
    ip: req.ip || req.socket?.remoteAddress || 'unknown',
    requestId: req.id || 'unknown',
  };
}

exports.register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body, requestMeta(req));
  res.status(201).json({ user });
});

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body, requestMeta(req));
  res.json(result);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.forgotPassword(req.body, requestMeta(req));
  res.json(result);
});

exports.verifyResetOtp = asyncHandler(async (req, res) => {
  const result = await authService.verifyResetOtp(req.body, requestMeta(req));
  res.json(result);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const result = await authService.resetPasswordWithToken(req.body, requestMeta(req));
  res.json(result);
});
