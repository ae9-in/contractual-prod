const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const { sanitizeProjectForClient } = require('../utils/projectResponse');

exports.getProjectPayment = asyncHandler(async (req, res) => {
  const payload = await paymentService.getProjectPayment(Number(req.params.id), req.user);
  res.json({
    ...payload,
    project: sanitizeProjectForClient(payload.project, { isOwner: true }),
  });
});

exports.fundProjectEscrow = asyncHandler(async (req, res) => {
  const payload = await paymentService.fundProjectEscrow(Number(req.params.id), req.user.id);
  res.json(payload);
});

exports.releaseProjectEscrow = asyncHandler(async (req, res) => {
  const payload = await paymentService.releaseProjectEscrow(Number(req.params.id), req.user.id);
  res.json(payload);
});

exports.addProjectTip = asyncHandler(async (req, res) => {
  const payload = await paymentService.addProjectTip(Number(req.params.id), req.user.id, req.body);
  res.json(payload);
});

exports.getGatewayConfig = asyncHandler(async (req, res) => {
  const config = paymentService.getGatewayConfig();
  res.json(config);
});

exports.createProjectGatewayOrder = asyncHandler(async (req, res) => {
  const payload = await paymentService.createProjectGatewayOrder(Number(req.params.id), req.user.id, req.body);
  res.json(payload);
});

exports.verifyProjectGatewayPayment = asyncHandler(async (req, res) => {
  const payload = await paymentService.verifyProjectGatewayPayment(Number(req.params.id), req.user.id, req.body);
  res.json(payload);
});

exports.handleGatewayWebhook = asyncHandler(async (req, res) => {
  await paymentService.handleGatewayWebhook(req.body, req.headers['x-razorpay-signature']);
  res.json({ ok: true });
});
