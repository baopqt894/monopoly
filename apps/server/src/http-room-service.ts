import { createHash } from 'node:crypto';
import type { RoomRequest, RoomResponse } from '@typhu/contracts/http';
import type { ServerMessage } from '@typhu/contracts/multiplayer';
import { RoomService, publicRoomSnapshot, type Room } from './rooms';
import type { RoomStore } from './room-store';

interface Presence {
  connectionId: string;
  lastSeen: number;
}
interface Receipt {
  requestId: string;
  connectionId: string;
  seatId: string;
  type: string;
}
export interface StoredRoom {
  version: 2;
  room: Room;
  presence: Record<string, Presence>;
  receipts: Receipt[];
  revision?: number;
}
const UUID = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i;
const CODE = /^[0-9A-F]{6}$/;
const PRESENCE_TIMEOUT = 45_000;
export const FINISHED_ROOM_TTL_MS = 120_000;
const error = (code: string, message: string): RoomResponse => ({
  messages: [{ type: 'ERROR', code, message }],
});

export class HttpRoomService {
  constructor(
    private store: RoomStore,
    private now = () => Date.now(),
  ) {}

  async handle(
    input: unknown,
    initialRead?: { code: string; value: string | null },
  ): Promise<RoomResponse> {
    if (!input || typeof input !== 'object')
      return error('INVALID_MESSAGE', 'Yêu cầu không hợp lệ.');
    const request = input as RoomRequest;
    if (!UUID.test(request.connectionId ?? '') || !UUID.test(request.requestId ?? '')) {
      return error('INVALID_MESSAGE', 'Phiên hoặc mã yêu cầu không hợp lệ.');
    }
    const message = request.message;
    if (
      message !== null &&
      (!message || typeof message !== 'object' || typeof message.type !== 'string')
    ) {
      return error('INVALID_MESSAGE', 'Yêu cầu không hợp lệ.');
    }
    const creating = message?.type === 'CREATE_ROOM';
    const joining = message?.type === 'JOIN_ROOM';
    const reconnecting = message?.type === 'RECONNECT';
    const code = creating
      ? createHash('sha256').update(request.requestId).digest('hex').slice(0, 6).toUpperCase()
      : joining
        ? String(message.code ?? '')
            .trim()
            .toUpperCase()
        : (request.roomCode ?? '');
    if (!CODE.test(code)) return error('INVALID_MESSAGE', 'Mã phòng không hợp lệ.');

    for (let attempt = 0; attempt < 8; attempt++) {
      const previous =
        attempt === 0 && initialRead?.code === code
          ? initialRead.value
          : await this.store.read(code);
      if (!previous && !creating)
        return error(
          joining ? 'ROOM_NOT_FOUND' : 'SESSION_EXPIRED',
          'Phòng không tồn tại hoặc đã hết hạn.',
        );
      const stored: StoredRoom | null = previous ? JSON.parse(previous) : null;
      if (stored && stored.version !== 2)
        return error('SESSION_EXPIRED', 'Phiên chơi không tương thích. Hãy tạo phòng mới.');
      // Old persisted bot-only rooms are garbage, never resume their timers.
      if (stored && !stored.room.seats.some(seat => !seat.bot)) {
        if (await this.store.compareAndSet(code, previous, null))
          return error('SESSION_EXPIRED', 'Phòng đã đóng.');
        continue;
      }
      if (stored?.room.phase === 'finished' && stored.room.matchEndedAt !== undefined &&
          this.now() >= stored.room.matchEndedAt + FINISHED_ROOM_TTL_MS) {
        if (await this.store.compareAndSet(code, previous, null))
          return error('SESSION_EXPIRED', 'Phòng đã kết thúc.');
        continue;
      }
      const receipt = stored?.receipts.find(
        (entry) =>
          entry.requestId === request.requestId && entry.connectionId === request.connectionId,
      );
      if (creating && stored && !receipt)
        return error('ROOM_CODE_COLLISION', 'Mã phòng trùng. Vui lòng tạo lại.');
      const time = this.now();
      if (receipt?.type === 'LEAVE_ROOM' && message?.type === 'LEAVE_ROOM')
        return { messages: [{ type: 'LEFT_ROOM' }] };
      const presence = stored?.presence ?? {};
      const service = new RoomService(this.now);
      if (stored) {
        for (const seat of stored.room.seats) {
          seat.peerId = null;
          seat.connected =
            !seat.bot && !!presence[seat.id] && time - presence[seat.id].lastSeen < PRESENCE_TIMEOUT;
        }
        // Expiry is checked before every command, not only by a background timer.
        if (stored.room.pendingTrade && stored.room.pendingTrade.expiresAt <= time)
          stored.room.pendingTrade = null;
        service.rooms.set(code, stored.room);
      }
      const messages: ServerMessage[] = [];
      const peerId = service.connect((response) => messages.push(structuredClone(response)));
      let seatId: string | undefined;
      if (stored && !joining && !creating) {
        if (typeof request.token !== 'string') return error('SESSION_EXPIRED', 'Thiếu phiên chơi.');
        const seat = stored.room.seats.find((entry) => !entry.bot && entry.token === request.token);
        if (!seat) return error('SESSION_EXPIRED', 'Phiên chơi không hợp lệ.');
        seatId = seat.id;
        if (!reconnecting && presence[seat.id]?.connectionId !== request.connectionId) {
          return error('SESSION_REPLACED', 'Phiên chơi đã được mở ở cửa sổ khác.');
        }
        service.handle(peerId, { type: 'RECONNECT', token: seat.token });
        if (!reconnecting && message !== null) {
          messages.length = 0;
          if (!receipt) service.handle(peerId, message);
        }
      } else if (receipt && stored) {
        const seat = stored.room.seats.find((entry) => entry.id === receipt.seatId);
        if (!seat || presence[seat.id]?.connectionId !== request.connectionId)
          return error('SESSION_REPLACED', 'Phiên đã thay đổi.');
        service.handle(peerId, { type: 'RECONNECT', token: seat.token });
        seatId = seat.id;
      } else {
        service.handle(peerId, message);
        const session = messages.find((entry) => entry.type === 'SESSION');
        if (!session || session.type !== 'SESSION') return { messages };
        seatId = session.seatId;
        if (creating) {
          const room = service.rooms.get(session.room.code)!;
          service.rooms.delete(room.code);
          room.code = code;
          service.rooms.set(code, room);
          for (const response of messages) if ('room' in response) response.room.code = code;
        }
      }
      const room = service.rooms.get(code);
      const responseError = messages.find((entry) => entry.type === 'ERROR');
      if (!room) {
        if (await this.store.compareAndSet(code, previous, null)) return { messages };
        continue;
      }
      const seat = room.seats.find((entry) => entry.id === seatId);
      const leaving = message?.type === 'LEAVE_ROOM' && !responseError;
      if (seat && !leaving)
        presence[seat.id] = { connectionId: request.connectionId, lastSeen: time };
      if (leaving && seatId) delete presence[seatId];
      for (const id of Object.keys(presence))
        if (!room.seats.some((entry) => entry.id === id)) delete presence[id];
      // Obtain a fresh redacted snapshot without exporting the private room/token data.
      let publicMessage = [...messages]
        .reverse()
        .find((entry) => entry.type === 'ROOM_STATE' || entry.type === 'SESSION');
      if (!publicMessage && seat && !leaving) {
        service.handle(peerId, { type: 'RECONNECT', token: seat.token });
        publicMessage = [...messages].reverse().find((entry) => entry.type === 'ROOM_STATE');
      }
      let result: RoomResponse;
      if (responseError) result = { messages: [responseError] };
      else if (leaving) result = { messages: [{ type: 'LEFT_ROOM' }] };
      else if (creating || joining || reconnecting) {
        const session = messages.find((entry) => entry.type === 'SESSION');
        result = { messages: session ? [session] : [] };
      } else
        result = {
          messages: publicMessage ? [{ type: 'ROOM_STATE', room: publicMessage.room }] : [],
        };
      const receipts = stored?.receipts ?? [];
      if (message && !responseError && !receipt && seatId) {
        receipts.push({
          requestId: request.requestId,
          connectionId: request.connectionId,
          seatId,
          type: message.type,
        });
      }
      for (const member of room.seats) member.peerId = null;
      const before = previous
        ? publicRoomSnapshot((JSON.parse(previous) as StoredRoom).room)
        : null;
      const after = publicRoomSnapshot(room);
      const revision =
        (stored?.revision ?? 0) + (JSON.stringify(before) === JSON.stringify(after) ? 0 : 1);
      // Snapshots include a monotonic revision, so a command response and the push
      // channel can arrive in either order without rolling the browser state back.
      for (const response of result.messages)
        if ('room' in response) response.room.revision = revision;
      const next: StoredRoom = {
        version: 2,
        room,
        presence,
        receipts: receipts.slice(-64),
        revision,
      };
      const expiresAt = room.phase === 'finished' && room.matchEndedAt !== undefined
        ? room.matchEndedAt + FINISHED_ROOM_TTL_MS : undefined;
      if (await this.store.compareAndSet(code, previous, JSON.stringify(next), expiresAt)) return result;
    }
    return error('ROOM_BUSY', 'Phòng đang nhận nhiều thao tác. Vui lòng thử lại.');
  }
}
