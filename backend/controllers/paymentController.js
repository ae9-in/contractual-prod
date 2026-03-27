const asyncHandler = require('../utils/asyncHandler');
const paymentService = require('../services/paymentService');
const { sanitizeProjectForClient } = require('../utils/projectResponse');
const { validateId } = require('../utils/validators');

exports.getProjectPayment = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.getProjectPayment(projectId, req.user);
  res.json({
    ...payload,
    project: sanitizeProjectForClient(payload.project, { isOwner: true }),
  });
});

exports.fundProjectEscrow = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.fundProjectEscrow(projectId, req.user.id);
  res.json(payload);
});

exports.releaseProjectEscrow = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.releaseProjectEscrow(projectId, req.user.id);
  res.json(payload);
});

exports.addProjectTip = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.addProjectTip(projectId, req.user.id, req.body);
  res.json(payload);
});

exports.getGatewayConfig = asyncHandler(async (req, res) => {
  const config = paymentService.getGatewayConfig();
  res.json(config);
});

exports.createProjectGatewayOrder = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.createProjectGatewayOrder(projectId, req.user.id, req.body);
  res.json(payload);
});

exports.verifyProjectGatewayPayment = asyncHandler(async (req, res) => {
  const projectId = validateId(req.params.id);
  const payload = await paymentService.verifyProjectGatewayPayment(projectId, req.user.id, req.body);
  res.json(payload);
});

exports.handleGatewayWebhook = asyncHandler(async (req, res) => {
  await paymentService.handleGatewayWebhook(req.body, req.headers['x-razorpay-signature']);
  res.json({ ok: true });
});
