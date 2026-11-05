import { MongoClient, MongoServerError, type Db } from 'mongodb';
import { logRoomFailure } from './room-diagnostics';

const ROOM_TTL = 30 * 60;

export interface RoomStore {
  read(code: string): Promise<string | null>;
  compareAndSet(code: string, expected: string | null, value: string | null, expiresAt?: number): Promise<boolean>;
  rateLimit(key: string, limit?: number): Promise<boolean>;
  ping(): Promise<void>;
  subscribe(
    code: string,
    onValue: (value: string | null) => void,
    onError: (cause: unknown) => void,
  ): Promise<() => Promise<void>>;
}

// Development/test only. Vercel instances must share MongoDB.
export class MemoryRoomStore implements RoomStore {
  constructor(private now = () => Date.now()) {}
  private listeners = new Map<string, Set<(value: string | null) => void>>();
  private rooms = new Map<string, { value: string; expires: number }>();
  private rates = new Map<string, { count: number; expires: number }>();
  async read(code: string) {
    const entry = this.rooms.get(code);
    if (!entry || entry.expires < this.now()) {
      this.rooms.delete(code);
      return null;
    }
    return entry.value;
  }
  async compareAndSet(
    code: string,
    expected: string | null,
    value: string | null,
    expiresAt?: number,
  ): Promise<boolean> {
    // No await between checking and setting, even when concurrent requests share this store.
    const entry = this.rooms.get(code);
    const current = entry && entry.expires >= this.now() ? entry.value : null;
    if (current !== expected) return false;
    if (value === null) this.rooms.delete(code);
    else this.rooms.set(code, { value, expires: expiresAt ?? this.now() + ROOM_TTL * 1000 });
    for (const listener of this.listeners.get(code) ?? []) queueMicrotask(() => listener(value));
    return true;
  }
  async rateLimit(key: string, limit = 35) {
    const now = this.now();
    for (const [id, rate] of this.rates) if (rate.expires <= now) this.rates.delete(id);
    const rate = this.rates.get(key) ?? { count: 0, expires: now + 5000 };
    rate.count++;
    this.rates.set(key, rate);
    return rate.count <= limit;
  }
  async ping() {}
  async subscribe(code: string, onValue: (value: string | null) => void) {
    const listeners = this.listeners.get(code) ?? new Set();
    listeners.add(onValue);
    this.listeners.set(code, listeners);
    return async () => {
      listeners.delete(onValue);
      if (!listeners.size) this.listeners.delete(code);
    };
  }
}

interface RoomDocument {
  _id: string;
  value: string;
  expiresAt: Date;
}
interface RateDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}
type Listener = { value: (value: string | null) => void; error: (cause: unknown) => void };
type MongoEventHub = {
  closed: boolean;
  listeners: Map<string, Set<Listener>>;
  close: () => Promise<void>;
};
const mongoEventHubs = new WeakMap<Db, Promise<MongoEventHub>>();
async function createMongoEventHub(db: Db): Promise<MongoEventHub> {
  const cursor = db
    .collection<RoomDocument>('rooms_v2')
    .watch([{ $match: { operationType: { $in: ['insert', 'update', 'replace', 'delete'] } } }], {
      fullDocument: 'updateLookup',
      maxAwaitTimeMS: 1000,
    });
  const hub: MongoEventHub = {
    closed: false,
    listeners: new Map(),
    async close() {
      hub.closed = true;
      await cursor.close();
    },
  };
  const publish = (change: Awaited<ReturnType<typeof cursor.tryNext>>) => {
    if (!change || hub.closed || !('documentKey' in change)) return;
    const value = 'fullDocument' in change ? (change.fullDocument?.value ?? null) : null;
    for (const listener of [...(hub.listeners.get(String(change.documentKey._id)) ?? [])])
      listener.value(value);
  };
  // The initial resume token means the aggregate cursor is open. Waiting for
  // tryNext() would add one idle maxAwaitTimeMS interval to every cold subscription.
  await new Promise<void>((resolve, reject) => {
    let ready = false;
    const timeout = setTimeout(() => {
      reject(new Error('Change stream startup timed out'));
      void hub.close().catch(() => {});
    }, 8000);
    cursor.once('resumeTokenChanged', () => {
      ready = true;
      clearTimeout(timeout);
      resolve();
    });
    cursor.on('error', (cause) => {
      clearTimeout(timeout);
      if (!ready) reject(cause);
      if (!hub.closed) {
        for (const listeners of [...hub.listeners.values()])
          for (const listener of [...listeners]) listener.error(cause);
        void hub.close().catch(() => {});
      }
    });
    cursor.on('change', publish);
  });
  return hub;
}
export class MongoRoomStore implements RoomStore {
  constructor(
    private database: () => Promise<Db>,
    private now = () => new Date(),
  ) {}
  private async rooms() {
    return (await this.database()).collection<RoomDocument>('rooms_v2');
  }
  async read(code: string) {
    const collection = await this.rooms();
    // TTL cleanup is asynchronous; expire in reads too, not only via Mongo's sweeper.
    const entry = await collection.findOne({ _id: code, expiresAt: { $gt: this.now() } });
    return entry?.value ?? null;
  }
  async compareAndSet(
    code: string,
    expected: string | null,
    value: string | null,
    expiresAt?: number,
  ): Promise<boolean> {
    const collection = await this.rooms();
    const now = this.now();
    if (expected === null) {
      if (value === null) return true;
      try {
        await collection.insertOne({
          _id: code,
          value,
          expiresAt: new Date(expiresAt ?? now.getTime() + ROOM_TTL * 1000),
        });
        return true;
      } catch (cause) {
        if (cause instanceof MongoServerError && cause.code === 11000) {
          const deleted = await collection.deleteOne({ _id: code, expiresAt: { $lte: now } });
          return deleted.deletedCount === 1 ? this.compareAndSet(code, null, value, expiresAt) : false;
        }
        throw cause;
      }
    }
    const filter = { _id: code, value: expected, expiresAt: { $gt: now } };
    if (value === null) return (await collection.deleteOne(filter)).deletedCount === 1;
    // Compare the exact previous value in the atomic update filter. A competing write retries.
    return (
      (
        await collection.updateOne(filter, {
          $set: { value, expiresAt: new Date(expiresAt ?? now.getTime() + ROOM_TTL * 1000) },
        })
      ).matchedCount === 1
    );
  }
  async rateLimit(key: string, limit = 35) {
    const collection = (await this.database()).collection<RateDocument>('room_rates');
    const now = this.now();
    const window = Math.floor(now.getTime() / 5000);
    const rate = await collection.findOneAndUpdate(
      { _id: `${key}:${window}` },
      {
        $inc: { count: 1 },
        $setOnInsert: { expiresAt: new Date(now.getTime() + 10_000) },
      },
      { upsert: true, returnDocument: 'after' },
    );
    return (rate?.count ?? limit + 1) <= limit;
  }
  async ping() {
    await (await this.database()).command({ ping: 1 });
  }
  async subscribe(
    code: string,
    onValue: (value: string | null) => void,
    onError: (cause: unknown) => void,
  ): Promise<() => Promise<void>> {
    const db = await this.database();
    // One change stream per database/instance, not per player: keep connections
    // available for commands even when many rooms share the same Vercel instance.
    let ready = mongoEventHubs.get(db);
    if (!ready) {
      ready = createMongoEventHub(db);
      mongoEventHubs.set(db, ready);
      const current = ready;
      void ready.catch(() => {
        if (mongoEventHubs.get(db) === current) mongoEventHubs.delete(db);
      });
    }
    const hub = await ready;
    if (hub.closed) {
      if (mongoEventHubs.get(db) === ready) mongoEventHubs.delete(db);
      return this.subscribe(code, onValue, onError);
    }
    const listener = { value: onValue, error: onError };
    const listeners = hub.listeners.get(code) ?? new Set<Listener>();
    listeners.add(listener);
    hub.listeners.set(code, listeners);
    return async () => {
      listeners.delete(listener);
      if (!listeners.size) hub.listeners.delete(code);
      if (!hub.listeners.size && !hub.closed) {
        if (mongoEventHubs.get(db) === ready) mongoEventHubs.delete(db);
        await hub.close();
      }
    };
  }
}

const localGlobal = globalThis as typeof globalThis & {
  typhuDevStore?: MemoryRoomStore;
  typhuMongo?: Promise<Db>;
};
function mongoDatabase(): Promise<Db> {
  if (!localGlobal.typhuMongo) {
    let client: MongoClient;
    try {
      client = new MongoClient(process.env.MONGODB_URI!, {
        maxPoolSize: 12,
        minPoolSize: 0,
        maxIdleTimeMS: 60_000,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 10_000,
      });
    } catch (cause) {
      logRoomFailure('mongodb.configure', cause);
      throw cause;
    }
    let operation: 'mongodb.connect' | 'mongodb.indexes' = 'mongodb.connect';
    localGlobal.typhuMongo = client
      .connect()
      .then(async () => {
        const db = client.db(process.env.MONGODB_DB ?? 'typhu');
        operation = 'mongodb.indexes';
        await Promise.all([
          db.collection('rooms_v2').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
          db.collection('room_rates').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        ]);
        return db;
      })
      .catch(async (cause) => {
        logRoomFailure(operation, cause);
        localGlobal.typhuMongo = undefined;
        await client.close();
        throw cause;
      });
  }
  return localGlobal.typhuMongo;
}
export function getRoomStore(): RoomStore {
  if (process.env.MONGODB_URI) return new MongoRoomStore(mongoDatabase);
  if (
    !process.env.VERCEL &&
    (process.env.NODE_ENV !== 'production' || process.env.ROOM_STORE === 'memory')
  ) {
    return (localGlobal.typhuDevStore ??= new MemoryRoomStore());
  }
  throw new Error('ROOM_STORE_NOT_CONFIGURED');
}
