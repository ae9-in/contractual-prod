require('./bootstrapPgTestEnv');

const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const userModel = require('../models/userModel');
const passwordResetTokenModel = require('../models/passwordResetTokenModel');
const notifier = require('../services/passwordResetNotifier');
const authService = require('../services/authService');

function withMock(obj, key, impl) {
  const original = obj[key];
  obj[key] = impl;
  return () => {
    obj[key] = original;
  };
}

test('password-reset request returns generic success for unknown email', async () => {
  const restoreFindByEmail = withMock(userModel, 'findByEmail', async () => null);
  try {
    const result = await authService.forgotPassword(
      { email: 'unknown@example.com' },
      { ip: '127.0.0.1', requestId: 't1' },
    );
    assert.equal(result.success, true);
    assert.match(String(result.message || ''), /If an account exists/i);
    assert.equal(result.token, undefined);
  } finally {
    restoreFindByEmail();
  }
});

test('password-reset request creates token and returns session token', async () => {
  let clearedForUserId = null;
  let createdPayload = null;
  let mailPayload = null;

  const restoreFindByEmail = withMock(userModel, 'findByEmail', async () => ({
    id: 42,
    email: 'known@example.com',
  }));
  const restoreClear = withMock(passwordResetTokenModel, 'clearActiveByUserId', async (userId) => {
    clearedForUserId = userId;
  });
  const restoreCreate = withMock(passwordResetTokenModel, 'create', async (payload) => {
    createdPayload = payload;
    return 1;
  });
  const restoreSend = withMock(notifier, 'sendPasswordResetOtp', async (payload) => {
    mailPayload = payload;
  });

  try {
    const result = await authService.forgotPassword(
      { email: 'known@example.com' },
      { ip: '127.0.0.1', requestId: 't2' },
    );
    assert.equal(result.success, true);
    assert.equal(typeof result.token, 'string');
    assert.ok(result.token.length >= 32);
    assert.equal(clearedForUserId, 42);
    assert.equal(createdPayload.userId, 42);
    assert.equal(mailPayload.email, 'known@example.com');
    assert.equal(typeof mailPayload.otp, 'string');
    assert.equal(mailPayload.otp.length, 6);
  } finally {
    restoreSend();
    restoreCreate();
    restoreClear();
    restoreFindByEmail();
  }
});

test('password-reset verify fails and increments attempts on wrong otp', async () => {
  const token = 'a'.repeat(64);
  const tokenHash = await bcrypt.hash(token, 10);
  const otpHash = await bcrypt.hash('123456', 10);

  let incrementedId = null;
  const restoreList = withMock(passwordResetTokenModel, 'listActiveByTokenPrefix', async () => ([
    {
      id: 99,
      userId: 77,
      tokenHash,
      otpHash,
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
  ]));
  const restoreInc = withMock(passwordResetTokenModel, 'incrementAttempts', async (id) => {
    incrementedId = id;
  });

  try {
    await assert.rejects(
      () => authService.verifyResetOtp({ token, otp: '000000' }, { ip: '127.0.0.1', requestId: 't3' }),
      /Invalid or expired code/,
    );
    assert.equal(incrementedId, 99);
  } finally {
    restoreInc();
    restoreList();
  }
});

test('password-reset confirm updates password and marks token used', async () => {
  const token = 'b'.repeat(64);
  const tokenHash = await bcrypt.hash(token, 10);
  const otpHash = await bcrypt.hash('654321', 10);

  let updatedUserId = null;
  let updatedPasswordHash = '';
  let markedUsedId = null;

  const restoreList = withMock(passwordResetTokenModel, 'listActiveByTokenPrefix', async () => ([
    {
      id: 123,
      userId: 66,
      tokenHash,
      otpHash,
      attempts: 0,
      usedAt: null,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    },
  ]));
  const restoreUpdateByUserId = withMock(userModel, 'updatePasswordByUserId', async (userId, hash) => {
    updatedUserId = userId;
    updatedPasswordHash = hash;
    return true;
  });
  const restoreMarkUsed = withMock(passwordResetTokenModel, 'markUsed', async (id) => {
    markedUsedId = id;
  });

  try {
    const result = await authService.resetPasswordWithToken(
      { token, newPassword: 'Strong@123' },
      { ip: '127.0.0.1', requestId: 't4' },
    );
    assert.equal(result.success, true);
    assert.equal(updatedUserId, 66);
    assert.equal(markedUsedId, 123);
    assert.equal(await bcrypt.compare('Strong@123', updatedPasswordHash), true);
  } finally {
    restoreMarkUsed();
    restoreUpdateByUserId();
    restoreList();
  }
});

