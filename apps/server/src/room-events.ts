import { randomUUID } from 'node:crypto';
import { automaticAction } from '@typhu/game-engine';
import { CARD_AUTO_RESOLVE_MS } from '@typhu/game-content';
import type { RoomRequest } from '@typhu/contracts/http';
import type { ServerMessage } from '@typhu/contracts/multiplayer';
import { HttpRoomService, type StoredRoom } from './http-room-service';
import { publicRoomSnapshot } from './rooms';
import { getRoomStore, type RoomStore } from './room-store';
import { readRoomRequest, requestRateKey, unavailableResponse } from './http-gateway';
import { logRoomFailure } from './room-diagnostics';
import { mobileMessage, wantsMobilePresentation } from './mobile-presentation';

export function roomEvent(
  value: string | null,
  identity: Pick<RoomRequest, 'token' | 'connectionId'>,
): ServerMessage {
  if (!value) return { type: 'ERROR', code: 'SESSION_EXPIRED', message: 'Phòng đã hết hạn.' };
  const stored = JSON.parse(value) as StoredRoom;
  const seat = stored.room.seats.find((entry) => !entry.bot && entry.token === identity.token);
  if (stored.version !== 2 || !seat)
    return { type: 'ERROR', code: 'SESSION_EXPIRED', message: 'Phiên chơi đã hết hạn.' };
  if (stored.presence[seat.id]?.connectionId !== identity.connectionId) {
    return {
      type: 'ERROR',
      code: 'SESSION_REPLACED',
      message: 'Phiên chơi đã được mở ở cửa sổ khác.',
    };
  }
  return {
    type: 'ROOM_STATE',
    room: { ...publicRoomSnapshot(stored.room), revision: stored.revision ?? 0 },
  };
}

export async function roomEventsPost(
  request: Request,
  providedStore?: RoomStore,
  timing = { durationMs: 55_000, heartbeatMs: 15_000 },
): Promise<Response> {
  const input = await readRoomRequest(request);
  if (input instanceof Response) return input;
  if (!input || typeof input !== 'object' || (input as RoomRequest).message !== null) {
    return new Response(null, { status: 400 });
  }
  const identity = input as RoomRequest;
  try {
    const store = providedStore ?? getRoomStore();
    if (!(await store.rateLimit(requestRateKey(request))))
      return new Response(null, { status: 429 });
    const service = new HttpRoomService(store);
    const auth = await service.handle(identity);
    const initial = auth.messages[0];
    if (!initial || initial.type !== 'ROOM_STATE') {
      return Response.json(auth, {
        status: 401,
        headers: { 'Cache-Control': 'no-store, private' },
      });
    }
    const encoder = new TextEncoder();
    const mobile = wantsMobilePresentation(request);
    let controller: ReadableStreamDefaultController<Uint8Array>;
    let closed = false;
    let unsubscribe: (() => Promise<void>) | undefined;
    let heartbeat: ReturnType<typeof setInterval> | undefined;
    let end: ReturnType<typeof setTimeout> | undefined;
    let expiry: ReturnType<typeof setTimeout> | undefined;
    let heartbeatBusy = false;
    let lastRevision = -1;
    function close() {
      if (closed) return;
      closed = true;
      clearInterval(heartbeat);
      clearTimeout(end);
      clearTimeout(expiry);
      request.signal.removeEventListener('abort', close);
      void unsubscribe?.().catch(() => {});
      try {
        controller.close();
      } catch {
        /* Reader already cancelled. */
      }
    }
    async function refresh() {
      if (closed || heartbeatBusy) return;
      heartbeatBusy = true;
      try {
        const response = await service.handle({
          ...identity,
          requestId: randomUUID(),
          message: null,
        });
        response.messages.forEach(send);
      } catch {
        close();
      } finally {
        heartbeatBusy = false;
      }
    }
    function send(message: ServerMessage) {
      if (closed) return;
      if (message.type === 'ROOM_STATE') {
        const revision = message.room.revision ?? 0;
        if (revision <= lastRevision) return;
        lastRevision = revision;
        clearTimeout(expiry);
        const deadlines = [message.room.pendingTrade?.expiresAt, message.room.botActionAt, message.room.actionDeadlineAt, message.room.phase === 'playing' ? message.room.matchDeadlineAt : undefined]
          .filter((value): value is number => value !== undefined);
        const game = message.room.game;
        if (game && message.room.actionStartsAt !== undefined &&
          (automaticAction(game) || (game.phase === 'card' && !game.drawnCard?.revealed)))
          deadlines.push(message.room.actionStartsAt +
            (game.phase === 'card' && game.drawnCard?.revealed ? CARD_AUTO_RESOLVE_MS : 0));
        if (deadlines.length) {
          expiry = setTimeout(
            () => {
              void refresh();
            },
            Math.max(1, Math.min(...deadlines) - Date.now() + 1),
          );
        }
      }
      controller.enqueue(encoder.encode(`data:${JSON.stringify(mobile ? mobileMessage(message) : message)}\n\n`));
      if (message.type === 'ERROR' || (message.type === 'ROOM_STATE' && message.room.phase === 'finished')) close();
    }
    const stream = new ReadableStream<Uint8Array>({
      async start(target) {
        controller = target;
        request.signal.addEventListener('abort', close, { once: true });
        if (request.signal.aborted) {
          close();
          return;
        }
        send(initial);
        if (closed) return;
        heartbeat = setInterval(() => {
          if (!closed) controller.enqueue(encoder.encode(':keepalive\n\n'));
        }, timing.heartbeatMs);
        end = setTimeout(close, timing.durationMs);
        try {
          unsubscribe = await store.subscribe(
            identity.roomCode!,
            (value) => {
              try {
                send(roomEvent(value, identity));
              } catch {
                close();
              }
            },
            (cause) => {
              logRoomFailure('events.subscribe', cause);
              send({
                type: 'ERROR',
                code: 'STREAM_UNAVAILABLE',
                message: 'Đang khôi phục đồng bộ trực tiếp…',
              });
            },
          );
          if (closed) {
            await unsubscribe();
            return;
          }
          // Close the subscribe/read race; revisions discard duplicates or out-of-order events.
          send(roomEvent(await store.read(identity.roomCode!), identity));
        } catch (cause) {
          logRoomFailure('events.subscribe', cause);
          send({
            type: 'ERROR',
            code: 'STREAM_UNAVAILABLE',
            message: 'Đang khôi phục đồng bộ trực tiếp…',
          });
        }
      },
      cancel() {
        close();
      },
    });
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, private, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (cause) {
    return unavailableResponse(cause, 'events');
  }
}
