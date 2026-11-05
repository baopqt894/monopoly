import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

const origin = process.env.ROOM_BENCHMARK_ORIGIN ?? 'http://localhost:3000';
const baseline = process.argv.includes('--baseline');
async function observePolling(host) {
  let latest = await host.send(null),
    stopped = false,
    polls = 1;
  const received = new Map([[latest.revision, performance.now()]]),
    waiters = new Set();
  const loop = (async () => {
    while (!stopped) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (stopped) break;
      latest = await host.send(null);
      polls++;
      received.set(latest.revision, performance.now());
      for (const check of [...waiters]) check(latest);
    }
  })();
  return {
    received,
    get pollRequests() {
      return polls;
    },
    waiting(predicate) {
      if (predicate(latest)) return Promise.resolve(latest);
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          waiters.delete(check);
          reject(new Error('Polling observer timed out'));
        }, 10000);
        const check = (room) => {
          if (predicate(room)) {
            clearTimeout(timeout);
            waiters.delete(check);
            resolve(room);
          }
        };
        waiters.add(check);
      });
    },
    async close() {
      stopped = true;
      await loop;
    },
  };
}
function player(name) {
  const connectionId = randomUUID();
  let token, roomCode;
  const payload = (message) => ({
    connectionId,
    requestId: randomUUID(),
    token,
    roomCode,
    message,
  });
  return {
    name,
    payload,
    async send(message) {
      const response = await fetch(`${origin}/api/room`, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(message)),
        signal: AbortSignal.timeout(15000),
      });
      const data = await response.json();
      const error = data.messages?.find((entry) => entry.type === 'ERROR');
      if (!response.ok || error)
        throw new Error(`Benchmark request failed: ${error?.code ?? response.status}`);
      const session = data.messages.find((entry) => entry.type === 'SESSION');
      if (session) {
        token = session.token;
        roomCode = session.room.code;
      }
      return data.messages.findLast((entry) => entry.room)?.room;
    },
    async observe() {
      const abort = new AbortController();
      const response = await fetch(`${origin}/api/room/events`, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload(null)),
        signal: abort.signal,
      });
      if (!response.ok || !response.body) throw new Error(`Stream unavailable: ${response.status}`);
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let latest,
        buffer = '';
      const received = new Map(),
        waiters = new Set();
      const waiting = (predicate) => {
        if (latest && predicate(latest)) return Promise.resolve(latest);
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            waiters.delete(check);
            reject(new Error('Observer did not receive state'));
          }, 7000);
          const check = (room) => {
            if (predicate(room)) {
              clearTimeout(timeout);
              waiters.delete(check);
              resolve(room);
            }
          };
          waiters.add(check);
        });
      };
      const loop = (async () => {
        try {
          while (true) {
            const chunk = await reader.read();
            if (chunk.done) break;
            buffer += decoder.decode(chunk.value, { stream: true });
            let boundary;
            while ((boundary = buffer.indexOf('\n\n')) >= 0) {
              const event = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              if (!event.startsWith('data:')) continue;
              const message = JSON.parse(event.slice(5));
              if (message.type === 'ERROR') throw new Error(`Observer error: ${message.code}`);
              if (message.type === 'ROOM_STATE') {
                latest = message.room;
                received.set(latest.revision, performance.now());
                for (const check of [...waiters]) check(latest);
              }
            }
          }
        } catch (cause) {
          if (!abort.signal.aborted) throw cause;
        }
      })();
      // Attach a rejection handler immediately while mutations run.
      void loop.catch(() => {});
      await waiting(() => true);
      return {
        waiting,
        received,
        async close() {
          abort.abort();
          await reader.cancel().catch(() => {});
          await loop;
        },
      };
    },
  };
}
const host = player('QA Perf Host'),
  guest = player('QA Perf Guest');
let observer;
try {
  const room = await host.send({
    type: 'CREATE_ROOM',
    name: host.name,
    mode: 'classic',
    maxPlayers: 2,
    maxRounds: 8,
  });
  observer = baseline ? await observePolling(host) : await host.observe();
  await guest.send({ type: 'JOIN_ROOM', name: guest.name, code: room.code });
  await observer.waiting((state) => state.seats.length === 2);
  const samples = [];
  for (let index = 0; index < 5; index++) {
    const ready = index % 2 === 0,
      start = performance.now();
    const result = await guest.send({ type: 'SET_READY', ready });
    const commandMs = Math.round(performance.now() - start);
    await observer.waiting(
      (state) =>
        (result.revision === undefined || state.revision >= result.revision) &&
        state.seats.find((seat) => seat.name === guest.name)?.ready === ready,
    );
    samples.push({
      commandMs,
      observerMs: Math.round(observer.received.get(result.revision) - start),
    });
  }
  console.log(
    JSON.stringify(
      {
        origin,
        transport: baseline ? 'polling-baseline' : 'push',
        samples,
        medianCommandMs: samples.map((value) => value.commandMs).sort((a, b) => a - b)[2],
        medianObserverMs: samples.map((value) => value.observerMs).sort((a, b) => a - b)[2],
        observerPollRequests: observer.pollRequests ?? 0,
      },
      null,
      2,
    ),
  );
} finally {
  await observer?.close();
  await guest.send({ type: 'LEAVE_ROOM' }).catch(() => {});
  await host.send({ type: 'LEAVE_ROOM' }).catch(() => {});
}
