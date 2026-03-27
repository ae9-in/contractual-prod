const pool = require('../config/db');

function normalizePaymentRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId,
    amount: Number(row.amount || 0),
    tipTotal: Number(row.tipTotal || 0),
    status: row.status,
    fundedAt: row.fundedAt,
    releasedAt: row.releasedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function normalizeTransactionRow(row) {
  return {
    id: row.id,
    paymentId: row.paymentId,
    projectId: row.projectId,
    actorUserId: row.actorUserId,
    actorName: row.actorName,
    type: row.type,
    amount: Number(row.amount || 0),
    note: row.note,
    createdAt: row.createdAt,
  };
}

function normalizeOrderRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    projectId: row.projectId,
    paymentId: row.paymentId,
    businessId: row.businessId,
    purpose: row.purpose,
    amountPaise: Number(row.amountPaise || 0),
    currency: row.currency,
    provider: row.provider,
    providerOrderId: row.providerOrderId,
    providerPaymentId: row.providerPaymentId,
    providerSignature: row.providerSignature,
    note: row.note,
    status: row.status,
    paidAt: row.paidAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

async function createForProject(projectId, amount) {
  await pool.execute(
    `INSERT INTO project_payments (project_id, amount, status)
     VALUES (?, ?, 'Unfunded')
     ON CONFLICT (project_id) DO UPDATE SET amount = EXCLUDED.amount`,
    [projectId, amount],
  );
}

async function getByProjectId(projectId) {
  const [rows] = await pool.execute(
    `SELECT id, project_id AS projectId, amount, tip_total AS tipTotal, status,
      funded_at AS fundedAt, released_at AS releasedAt,
      created_at AS createdAt, updated_at AS updatedAt
     FROM project_payments
     WHERE project_id = ?
     LIMIT 1`,
    [projectId],
  );
  return normalizePaymentRow(rows[0] || null);
}

async function listTransactionsByProject(projectId) {
  const [rows] = await pool.execute(
    `SELECT t.id, t.payment_id AS paymentId, t.project_id AS projectId, t.actor_user_id AS actorUserId,
      t.type, t.amount, t.note, t.created_at AS createdAt, u.name AS actorName
     FROM project_payment_transactions t
     LEFT JOIN users u ON u.id = t.actor_user_id
     WHERE t.project_id = ?
     ORDER BY t.created_at DESC, t.id DESC`,
    [projectId],
  );
  return rows.map(normalizeTransactionRow);
}

async function fundEscrowTx(projectId, businessId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [projectRows] = await connection.execute(
      `SELECT id, business_id AS businessId, status, budget
       FROM projects
       WHERE id = ?
       FOR UPDATE`,
      [projectId],
    );
    const project = projectRows[0];
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (Number(project.businessId) !== Number(businessId)) throw new Error('FORBIDDEN');
    if (!['Assigned', 'Submitted', 'Completed'].includes(project.status)) throw new Error('PROJECT_NOT_ASSIGNABLE');

    await connection.execute(
      `INSERT INTO project_payments (project_id, amount, status)
       VALUES (?, ?, 'Unfunded')
       ON CONFLICT (project_id) DO UPDATE SET amount = EXCLUDED.amount`,
      [projectId, project.budget],
    );

    const [paymentRows] = await connection.execute(
      `SELECT id, status, amount
       FROM project_payments
       WHERE project_id = ?
       FOR UPDATE`,
      [projectId],
    );
    const payment = paymentRows[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status !== 'Unfunded') throw new Error('ALREADY_FUNDED');

    await connection.execute(
      `UPDATE project_payments
       SET status = 'Funded', funded_at = CURRENT_TIMESTAMP, released_at = NULL
       WHERE id = ?`,
      [payment.id],
    );

    await connection.execute(
      `INSERT INTO project_payment_transactions (payment_id, project_id, actor_user_id, type, amount, note)
       VALUES (?, ?, ?, 'Funded', ?, ?)`,
      [payment.id, projectId, businessId, payment.amount, 'Escrow funded by business'],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function releaseEscrowTx(projectId, businessId) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [projectRows] = await connection.execute(
      `SELECT id, business_id AS businessId, status
       FROM projects
       WHERE id = ?
       FOR UPDATE`,
      [projectId],
    );
    const project = projectRows[0];
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (Number(project.businessId) !== Number(businessId)) throw new Error('FORBIDDEN');
    if (!['Submitted', 'Completed'].includes(project.status)) throw new Error('PROJECT_NOT_SUBMITTED');

    const [paymentRows] = await connection.execute(
      `SELECT id, amount, status
       FROM project_payments
       WHERE project_id = ?
       FOR UPDATE`,
      [projectId],
    );
    const payment = paymentRows[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status !== 'Funded') throw new Error('NOT_FUNDED');

    await connection.execute(
      `UPDATE project_payments
       SET status = 'Released', released_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [payment.id],
    );

    await connection.execute(
      `INSERT INTO project_payment_transactions (payment_id, project_id, actor_user_id, type, amount, note)
       VALUES (?, ?, ?, 'Released', ?, ?)`,
      [payment.id, projectId, businessId, payment.amount, 'Escrow released to freelancer'],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function addTipTx(projectId, businessId, tipAmount, note = null) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [projectRows] = await connection.execute(
      `SELECT id, business_id AS businessId, status
       FROM projects
       WHERE id = ?
       FOR UPDATE`,
      [projectId],
    );
    const project = projectRows[0];
    if (!project) throw new Error('PROJECT_NOT_FOUND');
    if (Number(project.businessId) !== Number(businessId)) throw new Error('FORBIDDEN');
    if (!['Submitted', 'Completed'].includes(project.status)) throw new Error('PROJECT_NOT_SUBMITTED');

    const [paymentRows] = await connection.execute(
      `SELECT id, amount, tip_total AS tipTotal, status
       FROM project_payments
       WHERE project_id = ?
       FOR UPDATE`,
      [projectId],
    );
    const payment = paymentRows[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');
    if (payment.status !== 'Released') throw new Error('NOT_RELEASED');

    await connection.execute(
      `UPDATE project_payments
       SET tip_total = tip_total + ?
       WHERE id = ?`,
      [tipAmount, payment.id],
    );

    await connection.execute(
      `INSERT INTO project_payment_transactions (payment_id, project_id, actor_user_id, type, amount, note)
       VALUES (?, ?, ?, 'Tip', ?, ?)`,
      [payment.id, projectId, businessId, tipAmount, note || 'Business tip'],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function createGatewayOrderRecord({
  projectId,
  paymentId,
  businessId,
  purpose,
  amountPaise,
  providerOrderId,
  currency = 'INR',
  provider = 'razorpay',
  note = null,
}) {
  await pool.execute(
    `INSERT INTO project_payment_orders
      (project_id, payment_id, business_id, purpose, amount_paise, currency, provider, provider_order_id, note, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Created')`,
    [projectId, paymentId, businessId, purpose, amountPaise, currency, provider, providerOrderId, note || null],
  );
}

async function findOrderByProviderOrderId(providerOrderId) {
  const [rows] = await pool.execute(
    `SELECT id, project_id AS projectId, payment_id AS paymentId, business_id AS businessId, purpose,
      amount_paise AS amountPaise, currency, provider, provider_order_id AS providerOrderId,
      provider_payment_id AS providerPaymentId, provider_signature AS providerSignature,
      note, status, paid_at AS paidAt, created_at AS createdAt, updated_at AS updatedAt
     FROM project_payment_orders
     WHERE provider_order_id = ?
     LIMIT 1`,
    [providerOrderId],
  );
  return normalizeOrderRow(rows[0] || null);
}

async function verifyOrderPaymentTx({
  projectId,
  businessId = null,
  providerOrderId,
  providerPaymentId,
  providerSignature = null,
  source = 'checkout',
}) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [orderRows] = await connection.execute(
      `SELECT id, project_id AS projectId, payment_id AS paymentId, business_id AS businessId, purpose,
        amount_paise AS amountPaise, currency, provider, provider_order_id AS providerOrderId,
        provider_payment_id AS providerPaymentId, provider_signature AS providerSignature,
        note, status
       FROM project_payment_orders
       WHERE provider_order_id = ?
       FOR UPDATE`,
      [providerOrderId],
    );
    const order = orderRows[0];
    if (!order) throw new Error('ORDER_NOT_FOUND');
    if (Number(order.projectId) !== Number(projectId)) throw new Error('PROJECT_MISMATCH');
    if (businessId != null && Number(order.businessId) !== Number(businessId)) throw new Error('FORBIDDEN');
    if (order.status === 'Paid') throw new Error('ALREADY_PAID');
    if (order.status !== 'Created') throw new Error('ORDER_NOT_ACTIVE');

    const [paymentRows] = await connection.execute(
      `SELECT id, amount, tip_total AS tipTotal, status
       FROM project_payments
       WHERE id = ?
       FOR UPDATE`,
      [order.paymentId],
    );
    const payment = paymentRows[0];
    if (!payment) throw new Error('PAYMENT_NOT_FOUND');

    if (order.purpose === 'Escrow') {
      if (payment.status !== 'Unfunded') throw new Error('ALREADY_FUNDED');
      await connection.execute(
        `UPDATE project_payments
         SET status = 'Funded', funded_at = CURRENT_TIMESTAMP, released_at = NULL
         WHERE id = ?`,
        [payment.id],
      );
      await connection.execute(
        `INSERT INTO project_payment_transactions (payment_id, project_id, actor_user_id, type, amount, note)
         VALUES (?, ?, ?, 'Funded', ?, ?)`,
        [
          payment.id,
          projectId,
          order.businessId,
          Number(order.amountPaise) / 100,
          source === 'webhook' ? 'Escrow funded (gateway webhook)' : 'Escrow funded (gateway checkout)',
        ],
      );
    } else if (order.purpose === 'Tip') {
      if (payment.status !== 'Released') throw new Error('NOT_RELEASED');
      await connection.execute(
        `UPDATE project_payments
         SET tip_total = tip_total + ?
         WHERE id = ?`,
        [Number(order.amountPaise) / 100, payment.id],
      );
      await connection.execute(
        `INSERT INTO project_payment_transactions (payment_id, project_id, actor_user_id, type, amount, note)
         VALUES (?, ?, ?, 'Tip', ?, ?)`,
        [
          payment.id,
          projectId,
          order.businessId,
          Number(order.amountPaise) / 100,
          order.note || 'Business tip via gateway',
        ],
      );
    } else {
      throw new Error('ORDER_PURPOSE_UNSUPPORTED');
    }

    await connection.execute(
      `UPDATE project_payment_orders
       SET status = 'Paid',
           provider_payment_id = ?,
           provider_signature = ?,
           paid_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [providerPaymentId, providerSignature, order.id],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  createForProject,
  getByProjectId,
  listTransactionsByProject,
  fundEscrowTx,
  releaseEscrowTx,
  addTipTx,
  createGatewayOrderRecord,
  findOrderByProviderOrderId,
  verifyOrderPaymentTx,
};
