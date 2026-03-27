require('./bootstrapPgTestEnv');

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const { persistUploadedFile, persistUploadedFiles } = require('../services/fileStorageService');

test('persistUploadedFile keeps originalName and builds route URL', async () => {
  const file = {
    path: path.join('C:', 'tmp', 'uploads', 'abc123-report.pdf'),
    originalname: 'Final Report.pdf',
    size: 5120,
  };

  const result = await persistUploadedFile(file, {
    folder: 'project-references',
    localRoutePrefix: '/uploads/project-references',
  });

  assert.equal(result.url, '/uploads/project-references/abc123-report.pdf');
  assert.equal(result.originalName, 'Final Report.pdf');
  assert.equal(result.size, 5120);
});

test('persistUploadedFiles returns empty array when no files provided', async () => {
  const result = await persistUploadedFiles([], {
    folder: 'submissions',
    localRoutePrefix: '/uploads/submissions',
  });
  assert.deepEqual(result, []);
});

