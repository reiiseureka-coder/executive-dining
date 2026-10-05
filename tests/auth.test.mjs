import test from 'node:test';
import assert from 'node:assert/strict';
import { observeAuthSession } from '../src/lib/authSession.ts';
import { isAdminEmailCallback, isUnclaimedLoginLanding } from '../src/lib/authLanding.ts';
function setup() {
  let emit, resolve, reject, unsubscribed = 0;
  const pending = new Promise((yes, no) => { resolve = yes; reject = no; });
  const auth = {
    onAuthStateChange(callback) { emit = callback; return { data: { subscription: { unsubscribe() { unsubscribed++; } } } }; },
    getSession() { return pending; },
  };
  const sessions = [];
  const stop = observeAuthSession(auth, session => sessions.push(session));
  return { emit: (...args) => emit(...args), resolve, reject, sessions, stop, count: () => unsubscribed };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
test('UI auth restores a session without any legacy profile table dependency', async () => {
  const fixture = setup(), session = { user: { id: 'user' } };
  fixture.resolve({ data: { session }, error: null }); await tick();
  assert.deepEqual(fixture.sessions, [session]); fixture.stop(); assert.equal(fixture.count(), 1);
});
test('late initial session cannot overwrite a newer sign-out or sign-in event', async () => {
  const fixture = setup();
  fixture.emit('SIGNED_OUT', null);
  fixture.resolve({ data: { session: { user: { id: 'old-user' } } }, error: null });
  await tick(); assert.deepEqual(fixture.sessions, [null]);
  fixture.emit('SIGNED_IN', { user: { id: 'new-user' } });
  assert.equal(fixture.sessions.at(-1).user.id, 'new-user'); fixture.stop();
});
test('initial auth failure settles signed out and never retries automatically', async () => {
  const fixture = setup(); fixture.reject(new Error('offline')); await tick();
  assert.deepEqual(fixture.sessions, [null]); fixture.stop();
});
test('unmount unsubscribes and ignores stale session responses and events', async () => {
  const fixture = setup(); fixture.stop();
  fixture.emit('SIGNED_IN', { user: { id: 'user' } });
  fixture.resolve({ data: { session: { user: { id: 'user' } } }, error: null }); await tick();
  assert.deepEqual(fixture.sessions, []); assert.equal(fixture.count(), 1);
});

test('only explicit successful admin email callback shapes can request landing', () => {
  assert.equal(isAdminEmailCallback('#access_token=synthetic&refresh_token=synthetic&type=invite'), true);
  assert.equal(isAdminEmailCallback('#access_token=synthetic&refresh_token=synthetic&type=magiclink'), true);
  for (const hash of ['', '#/', '#/curation', '#type=invite', '#access_token=synthetic&refresh_token=synthetic&type=recovery', '#error=expired&type=invite']) assert.equal(isAdminEmailCallback(hash), false);
});
test('callback landing never takes over an explicitly selected route', () => {
  assert.equal(isUnclaimedLoginLanding(''), true); assert.equal(isUnclaimedLoginLanding('#/'), true);
  assert.equal(isUnclaimedLoginLanding('#/nagoya'), false); assert.equal(isUnclaimedLoginLanding('#/about'), false);
});
