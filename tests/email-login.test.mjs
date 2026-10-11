import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEmailLinkRequest, emailCallbackError } from '../src/lib/emailLogin.ts';
test('email links never enroll users and return only to the fixed application origin', () => {
  assert.deepEqual(buildEmailLinkRequest(' fixture@example.test ', 'https://preview.example.test'), { email: 'fixture@example.test', options: { shouldCreateUser: false, emailRedirectTo: 'https://preview.example.test' } });
});
test('email link request rejects invalid email before contacting Auth', () => {
  for (const email of ['', 'no-at-sign', 'a b@example.com', `x${'a'.repeat(255)}@example.com`]) assert.throws(() => buildEmailLinkRequest(email, 'https://example.com'));
});
test('email redirect rejects untrusted paths, fragments, credentials and non-TLS remote origins', () => {
  for (const origin of ['https://example.com/redirect', 'https://example.com/#/curation', 'https://user:secret@example.com', 'http://example.com', 'javascript:alert(1)']) assert.throws(() => buildEmailLinkRequest('fixture@example.test', origin));
  assert.equal(buildEmailLinkRequest('fixture@example.test', 'http://127.0.0.1:4182').options.emailRedirectTo, 'http://127.0.0.1:4182');
});

test('expired callback errors are generic and do not echo provider details or credentials', () => {
  assert.equal(emailCallbackError('#/nagoya'), '');
  const message = emailCallbackError('#error=access_denied&error_description=private-token');
  assert.match(message, /ログインリンク/); assert.ok(!message.includes('private-token'));
});
