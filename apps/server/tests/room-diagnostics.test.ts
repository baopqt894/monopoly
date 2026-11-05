import test from 'node:test';
import assert from 'node:assert/strict';
import { MongoParseError, MongoServerError } from 'mongodb';
import { roomFailureDetails, roomConfigurationDetails } from '../src/room-diagnostics';
import { healthGet, unavailableResponse } from '../src/http-gateway';
import { MemoryRoomStore } from '../src/room-store';

test('diagnostics find nested DNS and MongoDB failures without exposing error contents', () => {
  const secret = 'mongodb+srv://private-user:secret-password@private-host/private-db';
  const error = Object.assign(new Error(secret), {
    name: 'MongoServerSelectionError',
    reason: { servers: new Map([['private-host', { error: Object.assign(new Error(secret), { code: 'ENOTFOUND' }) }]]) },
  });
  error.cause = error; // bounded traversal must handle cycles
  const details = roomFailureDetails(error);
  assert.equal(details.category, 'dns');
  assert.deepEqual(details.codes, ['ENOTFOUND']);
  assert.doesNotMatch(JSON.stringify(details), /private|secret|mongodb\+srv/);
  assert.equal(roomFailureDetails(new MongoServerError({message: secret, code: 18})).category, 'authentication');
  assert.equal(roomFailureDetails(new MongoServerError({message: secret, code: 13})).category, 'authorization');
  assert.equal(roomFailureDetails(new MongoServerError({message: secret, code: 85})).category, 'index_conflict');
  assert.equal(roomFailureDetails(new MongoParseError(secret)).category, 'invalid_configuration');
  assert.deepEqual(roomFailureDetails({name: secret, code: secret, stack: secret}), {
    category: 'unknown', names: [], codes: [],
  });
});

test('configuration diagnostics identify malformed values without logging the values', () => {
  const details = roomConfigurationDetails({ MONGODB_URI: ' "mongodb+srv://secret" ', MONGODB_DB: 'mongodb://secret' });
  assert.equal(details.uriScheme, 'invalid');
  assert.equal(details.uriSurroundingWhitespace, true);
  assert.equal(details.databaseInvalid, true);
  assert.doesNotMatch(JSON.stringify(details), /secret/);
  assert.equal(roomConfigurationDetails({}).databaseDefault, true);
});

test('HTTP failures emit safe server logs and keep error details out of public responses', async (t) => {
  const logs: string[] = [];
  t.mock.method(console, 'error', (value: string) => logs.push(value));
  const secret = 'mongodb+srv://secret-user:secret-password@secret-host/secret-db';
  const store = new MemoryRoomStore();
  store.ping = async () => { throw new MongoParseError(secret); };
  const health = await healthGet(store);
  assert.equal(health.status, 503);
  assert.deepEqual(await health.json(), {status: 'unavailable', message: 'Kho phòng chơi chưa sẵn sàng.'});
  const response = unavailableResponse(new MongoServerError({message: secret, code: 18}));
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|authentication|Mongo/);
  assert.equal(JSON.parse(logs[0]).operation, 'health');
  assert.equal(JSON.parse(logs[0]).category, 'invalid_configuration');
  assert.equal(JSON.parse(logs[1]).category, 'authentication');
  assert.doesNotMatch(logs.join(''), /secret-user|secret-password|secret-host|secret-db/);
});
