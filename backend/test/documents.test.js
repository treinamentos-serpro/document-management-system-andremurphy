const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { after, before, test } = require('node:test');

let server;
let storagePath;
let baseUrl;

before(async () => {
  storagePath = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-test-'));
  process.env.STORAGE_PATH = storagePath;

  const app = require('../src/app');
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await fs.rm(storagePath, { recursive: true, force: true });
});

test('faz upload, lista e baixa um documento do usuário', async () => {
  const formData = new FormData();
  formData.append('file', new Blob(['conteudo do documento'], { type: 'text/plain' }), 'documento.txt');

  const uploadResponse = await fetch(`${baseUrl}/upload`, {
    method: 'POST',
    headers: { 'X-User-Id': 'user-1' },
    body: formData,
  });

  assert.equal(uploadResponse.status, 201);
  const document = await uploadResponse.json();
  assert.equal(document.originalName, 'documento.txt');
  assert.equal(document.owner, 'user-1');
  assert.equal(document.size, 21);
  assert.ok(document.id);

  const listResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.equal(listResponse.status, 200);
  assert.deepEqual(await listResponse.json(), [document]);

  const otherUserListResponse = await fetch(`${baseUrl}/documents`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.equal(otherUserListResponse.status, 200);
  assert.deepEqual(await otherUserListResponse.json(), []);

  const downloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-1' },
  });
  assert.equal(downloadResponse.status, 200);
  assert.equal(await downloadResponse.text(), 'conteudo do documento');

  const unauthorizedDownloadResponse = await fetch(`${baseUrl}/documents/${document.id}/download`, {
    headers: { 'X-User-Id': 'user-2' },
  });
  assert.equal(unauthorizedDownloadResponse.status, 404);
});