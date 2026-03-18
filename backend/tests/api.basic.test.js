const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_USER = process.env.DB_USER || 'root';
process.env.DB_NAME = process.env.DB_NAME || 'freelancer_platform';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const app = require('../app');

test('GET /health returns ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: 'ok' });
});

test('POST /api/auth/register returns field-level validation details for bad payload', async () => {
  const res = await request(app).post('/api/auth/register').send({});
  assert.equal(res.status, 400);
  assert.match(String(res.body.error || ''), /Validation failed/i);
  assert.ok(Array.isArray(res.body.details), 'details should be array');
  assert.ok(res.body.details.length > 0, 'details should not be empty');
});

test('POST /api/auth/register validates contact phone format', async () => {
  const res = await request(app).post('/api/auth/register').send({
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    contactPhone: '98abc',
    role: 'freelancer',
  });
  assert.equal(res.status, 400);
  assert.match(String(res.body.error || ''), /contactPhone/i);
  assert.ok(Array.isArray(res.body.details), 'details should be array');
});

test('POST /api/auth/login returns validation error for invalid email/password', async () => {
  const res = await request(app).post('/api/auth/login').send({ email: 'bad', password: '123' });
  assert.equal(res.status, 400);
  assert.match(String(res.body.error || ''), /Validation failed/i);
});

test('GET /api/projects requires auth', async () => {
  const res = await request(app).get('/api/projects');
  assert.equal(res.status, 401);
});

test('GET /api/notifications requires auth', async () => {
  const res = await request(app).get('/api/notifications');
  assert.equal(res.status, 401);
});
