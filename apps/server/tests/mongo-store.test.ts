import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { MongoRoomStore } from '../src/room-store';
import { HttpRoomService } from '../src/http-room-service';
import type { RoomResponse } from '@typhu/contracts/http';

test(
  'MongoDB stores rooms across instances and atomically resolves competing writes',
  {
    skip: !process.env.TEST_MONGODB_URI,
    timeout: 30_000,
  },
  async () => {
    const client = new MongoClient(process.env.TEST_MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
    });
    const databaseName = `typhu_test_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
    const db = client.db(databaseName);
    try {
      await client.connect();
      const first = new MongoRoomStore(async () => db);
      const second = new MongoRoomStore(async () => db);
      assert.equal(await first.compareAndSet('CAS123', null, 'initial'), true);
      const results = await Promise.all([
        first.compareAndSet('CAS123', 'initial', 'first'),
        second.compareAndSet('CAS123', 'initial', 'second'),
      ]);
      assert.equal(results.filter(Boolean).length, 1);
      assert.ok(['first', 'second'].includes((await first.read('CAS123'))!));
      await db
        .collection('rooms_v2')
        .updateOne({ _id: 'CAS123' } as never, { $set: { expiresAt: new Date(0) } });
      assert.equal(await second.read('CAS123'), null);
      assert.equal(await second.compareAndSet('CAS123', null, 'new room'), true);
      assert.equal(await first.read('CAS123'), 'new room');
      const fixedTime = new Date();
      const rateStore = new MongoRoomStore(
        async () => db,
        () => fixedTime,
      );
      const quotas = await Promise.all(
        Array.from({ length: 36 }, () => rateStore.rateLimit('test-ip')),
      );
      assert.equal(quotas.filter(Boolean).length, 35);
      const hostConnection = randomUUID(),
        guestConnection = randomUUID();
      const session = (response: RoomResponse) => {
        const entry = response.messages.find((message) => message.type === 'SESSION');
        assert.ok(entry?.type === 'SESSION', JSON.stringify(response));
        return entry;
      };
      const host = session(
        await new HttpRoomService(first).handle({
          connectionId: hostConnection,
          requestId: randomUUID(),
          message: {
            type: 'CREATE_ROOM',
            name: 'Mongo host',
            mode: 'classic',
            maxPlayers: 2,
            maxRounds: 8,
          },
        }),
      );
      const guest = session(
        await new HttpRoomService(second).handle({
          connectionId: guestConnection,
          requestId: randomUUID(),
          message: { type: 'JOIN_ROOM', name: 'Mongo guest', code: host.room.code },
        }),
      );
      await new HttpRoomService(first).handle({
        connectionId: guestConnection,
        requestId: randomUUID(),
        roomCode: host.room.code,
        token: guest.token,
        message: { type: 'SET_READY', ready: true },
      });
      const started = await new HttpRoomService(second).handle({
        connectionId: hostConnection,
        requestId: randomUUID(),
        roomCode: host.room.code,
        token: host.token,
        message: { type: 'START_GAME' },
      });
      const state = started.messages.find((message) => message.type === 'ROOM_STATE');
      assert.ok(state?.type === 'ROOM_STATE');
      assert.equal(state.room.phase, 'playing');
      assert.equal(state.room.game?.players.length, 2);
    } finally {
      // This run creates and removes only its randomly named, isolated validation database.
      assert.match(databaseName, /^typhu_test_[a-f0-9]{20}$/);
      try {
        await db.dropDatabase();
      } finally {
        await client.close();
      }
    }
  },
);

// This needs a replica set: Atlas in local validation, Mongo 7 replica set in CI.
test(
  'MongoDB change streams deliver commits across independent connections without polling',
  {
    skip: !process.env.TEST_MONGODB_URI,
    timeout: 30_000,
  },
  async () => {
    const firstClient = new MongoClient(process.env.TEST_MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
    });
    const secondClient = new MongoClient(process.env.TEST_MONGODB_URI!, {
      serverSelectionTimeoutMS: 8000,
    });
    const databaseName = `typhu_test_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
    let unsubscribe: (() => Promise<void>) | undefined;
    try {
      await Promise.all([firstClient.connect(), secondClient.connect()]);
      const first = new MongoRoomStore(async () => firstClient.db(databaseName));
      const second = new MongoRoomStore(async () => secondClient.db(databaseName));
      assert.equal(await first.compareAndSet('PUSH01', null, 'initial'), true);
      let resolveEvent: ((value: string | null) => void) | undefined;
      let rejectEvent: ((cause: unknown) => void) | undefined;
      unsubscribe = await first.subscribe(
        'PUSH01',
        (value) => resolveEvent?.(value),
        (cause) => rejectEvent?.(cause),
      );
      const samples: number[] = [];
      let before = 'initial';
      for (let index = 0; index < 5; index++) {
        const next = `change-${index}`;
        let timeout: ReturnType<typeof setTimeout>;
        const event = new Promise<string | null>((resolve, reject) => {
          resolveEvent = resolve;
          rejectEvent = reject;
          timeout = setTimeout(() => reject(new Error('Change stream did not deliver')), 4000);
        });
        const start = performance.now();
        try {
          assert.equal(await second.compareAndSet('PUSH01', before, next), true);
          assert.equal(await event, next);
          samples.push(Math.round(performance.now() - start));
        } finally {
          clearTimeout(timeout!);
        }
        before = next;
      }
      console.log(
        JSON.stringify({
          mongoCommitToObserverMs: samples,
          medianMs: [...samples].sort((a, b) => a - b)[2],
        }),
      );
    } finally {
      await unsubscribe?.();
      assert.match(databaseName, /^typhu_test_[a-f0-9]{20}$/);
      try {
        await firstClient.db(databaseName).dropDatabase();
      } finally {
        await Promise.all([firstClient.close(), secondClient.close()]);
      }
    }
  },
);

test(
  'many subscribers share one MongoDB cursor and remain isolated by room',
  {
    skip: !process.env.TEST_MONGODB_URI,
    timeout: 30_000,
  },
  async () => {
    const client = new MongoClient(process.env.TEST_MONGODB_URI!, {
      maxPoolSize: 2,
      serverSelectionTimeoutMS: 8000,
      monitorCommands: true,
    });
    const databaseName = `typhu_test_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
    const db = client.db(databaseName);
    const stops: (() => Promise<void>)[] = [];
    try {
      await client.connect();
      const store = new MongoRoomStore(async () => db);
      await store.compareAndSet('ROOM01', null, 'one');
      await store.compareAndSet('ROOM02', null, 'two');
      let aggregates = 0;
      client.on('commandStarted', (event) => {
        if (event.commandName === 'aggregate') aggregates++;
      });
      const firstEvents: string[] = [],
        secondEvents: string[] = [];
      const errors: unknown[] = [];
      const subscriptions = await Promise.all(
        Array.from({ length: 15 }, () =>
          store.subscribe(
            'ROOM01',
            (value) => firstEvents.push(value!),
            (cause) => errors.push(cause),
          ),
        ),
      );
      stops.push(
        ...subscriptions,
        await store.subscribe(
          'ROOM02',
          (value) => secondEvents.push(value!),
          (cause) => errors.push(cause),
        ),
      );
      assert.equal(aggregates, 1);
      const timeoutAt = Date.now() + 4000;
      await store.compareAndSet('ROOM01', 'one', 'new-one');
      await store.compareAndSet('ROOM02', 'two', 'new-two');
      while ((firstEvents.length < 15 || secondEvents.length < 1) && Date.now() < timeoutAt)
        await new Promise((resolve) => setTimeout(resolve, 10));
      assert.equal(firstEvents.length, 15);
      assert.ok(firstEvents.every((value) => value === 'new-one'));
      assert.deepEqual(secondEvents, ['new-two']);
      assert.deepEqual(errors, []);
    } finally {
      await Promise.all(stops.map((stop) => stop()));
      assert.match(databaseName, /^typhu_test_[a-f0-9]{20}$/);
      try {
        await db.dropDatabase();
      } finally {
        await client.close();
      }
    }
  },
);
