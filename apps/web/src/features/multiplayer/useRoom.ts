import { useCallback, useEffect, useRef, useState } from 'react';
import type { ClientMessage, RoomSnapshot, ServerMessage } from '@typhu/contracts/multiplayer';
import type { RoomRequest, RoomResponse } from '@typhu/contracts/http';
import { RoomRevisionGate, roomEventDecoder } from './room-sync';

const SESSION_KEY = 'typhu:online-session:v2';
interface Identity {
  seatId: string;
  token: string;
  roomCode: string;
}
function savedSession(): Identity | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? 'null');
    return value &&
      typeof value.seatId === 'string' &&
      typeof value.token === 'string' &&
      typeof value.roomCode === 'string'
      ? value
      : null;
  } catch {
    return null;
  }
}

export function useRoom() {
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [identity, setIdentity] = useState<Identity | null>(savedSession);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const identityRef = useRef(identity);
  const sendRef = useRef<((message: ClientMessage) => void) | null>(null);

  useEffect(() => {
    let stopped = false;
    let finished = false;
    let finishExit: ReturnType<typeof setTimeout> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let streamRetry: ReturnType<typeof setTimeout> | undefined;
    let command: AbortController | undefined;
    let monitor: AbortController | undefined;
    let stream: { controller: AbortController; online: boolean; token: string } | undefined;
    let sending = false;
    let monitoring = false;
    let lastHeartbeatAt = 0;
    let networkFailed = false;
    const gate = new RoomRevisionGate();
    const connectionId = crypto.randomUUID();
    function connected() {
      if (stopped) return;
      setStatus('connected');
      if (networkFailed) {
        networkFailed = false;
        setError(null);
      }
    }
    function clearSession() {
      identityRef.current = null;
      setIdentity(null);
      setRoom(null);
      gate.reset();
      finished = false;
      clearTimeout(finishExit);
      stream?.controller.abort();
      stream = undefined;
      clearTimeout(streamRetry);
      try {
        sessionStorage.removeItem(SESSION_KEY);
      } catch {
        /* Optional storage. */
      }
    }
    function finishRoom() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      clearTimeout(streamRetry);
      monitor?.abort();
      stream?.controller.abort();
      stream = undefined;
      // The result remains readable locally; no SSE/heartbeat is needed anymore.
      try { sessionStorage.removeItem(SESSION_KEY); } catch { /* Optional storage. */ }
      finishExit = setTimeout(leaveFinishedRoom, 10_000);
    }
    function leaveFinishedRoom() {
      clearTimeout(finishExit);
      const payload = body({ type: 'LEAVE_ROOM' });
      // One bounded best-effort leave; server TTL covers a closed/offline browser.
      void fetch('/api/room', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), cache: 'no-store', keepalive: true,
        signal: AbortSignal.timeout(5000),
      }).catch(() => {});
      clearSession();
      setError(null);
      scheduleMonitor(15_000);
    }
    function receive(message: ServerMessage) {
      if (stopped || finished) return;
      if (message.type === 'SESSION') {
        const next = { seatId: message.seatId, token: message.token, roomCode: message.room.code };
        if (identityRef.current?.token !== next.token) {
          stream?.controller.abort();
          stream = undefined;
          gate.reset();
        }
        identityRef.current = next;
        setIdentity(next);
        if (gate.accept(message.room)) setRoom(message.room);
        setError(null);
        try {
          sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
        } catch {
          /* Optional storage. */
        }
        if (message.room.phase === 'finished') finishRoom();
        else openStream();
      } else if (message.type === 'ROOM_STATE') {
        if (message.room.code === identityRef.current?.roomCode && gate.accept(message.room)) {
          setRoom(message.room);
          if (message.room.phase === 'finished') finishRoom();
        }
      } else if (message.type === 'LEFT_ROOM') {
        clearSession();
      } else if (message.type === 'ERROR' && message.code !== 'STREAM_UNAVAILABLE') {
        setError(message.message);
        if (['SESSION_EXPIRED', 'SESSION_REPLACED'].includes(message.code)) clearSession();
      }
    }
    function body(message: ClientMessage | null): RoomRequest {
      return {
        connectionId,
        requestId: crypto.randomUUID(),
        roomCode: identityRef.current?.roomCode,
        token: identityRef.current?.token,
        message,
      };
    }
    // Commands have their own lane. A slow heartbeat or open stream never queues a click.
    async function request(message: ClientMessage | null, lane: 'command' | 'monitor') {
      if (stopped || finished || (lane === 'monitor' && monitoring)) return;
      if (lane === 'monitor') monitoring = true;
      lastHeartbeatAt = Date.now();
      const controller = new AbortController();
      if (lane === 'command') command = controller;
      else monitor = controller;
      const timeout = setTimeout(() => controller.abort(), 15_000);
      const payload = body(message);
      try {
        if (message === null && !payload.token) {
          const response = await fetch('/health', { cache: 'no-store', signal: controller.signal });
          if (!response.ok) throw new Error('Máy chủ chưa sẵn sàng. Vui lòng thử lại sau.');
        } else {
          const response = await fetch('/api/room', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            cache: 'no-store',
            signal: controller.signal,
          });
          const data = (await response.json()) as RoomResponse;
          if (stopped || (lane === 'monitor' && payload.token !== identityRef.current?.token))
            return;
          if (!Array.isArray(data.messages)) throw new Error('Phản hồi máy chủ không hợp lệ.');
          data.messages.forEach(receive);
          if (!response.ok) {
            if (response.status >= 500) {
              networkFailed = true;
              setStatus('disconnected');
            }
            return;
          }
        }
        connected();
      } catch (cause) {
        if (!stopped && !finished && !(lane === 'monitor' && controller.signal.aborted)) {
          networkFailed = true;
          setStatus('disconnected');
          setError(
            cause instanceof Error && cause.name !== 'AbortError'
              ? cause.message
              : 'Mất kết nối. Đang thử lại…',
          );
        }
      } finally {
        clearTimeout(timeout);
        if (lane === 'monitor') monitoring = false;
      }
    }
    function scheduleMonitor(delay: number) {
      clearTimeout(timer);
      if (!stopped && !finished)
        timer = setTimeout(() => {
          void tick();
        }, delay);
    }
    async function tick() {
      if (!sending) await request(null, 'monitor');
      // Push is primary; heartbeat only maintains presence. Poll quickly only while recovering.
      scheduleMonitor(identityRef.current ? (stream?.online ? 15_000 : 500) : 15_000);
    }
    function openStream() {
      const current = identityRef.current;
      if (stopped || finished || !current || stream) return;
      clearTimeout(streamRetry);
      const context = { controller: new AbortController(), online: false, token: current.token };
      stream = context;
      void (async () => {
        let failed = false;
        try {
          const response = await fetch('/api/room/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body(null)),
            cache: 'no-store',
            signal: context.controller.signal,
          });
          if (response.status === 401) {
            const data = (await response.json()) as RoomResponse;
            if (!stopped && stream === context) data.messages.forEach(receive);
            return;
          }
          if (!response.ok || !response.body) throw new Error('Stream unavailable');
          context.online = true;
          scheduleMonitor(15_000);
          const decode = roomEventDecoder((message) => {
            if (stopped || stream !== context || identityRef.current?.token !== context.token)
              return;
            if (message.type === 'ERROR' && message.code === 'STREAM_UNAVAILABLE') {
              failed = true;
              context.online = false;
              return;
            }
            receive(message);
            connected();
          });
          const reader = response.body.getReader();
          try {
            while (!stopped && stream === context) {
              const chunk = await reader.read();
              if (chunk.done) break;
              decode(chunk.value);
              // Network callbacks also maintain presence when a background tab's
              // interval timers are throttled. Never put the command behind this.
              if (Date.now() - lastHeartbeatAt >= 14_000 && !sending) void request(null, 'monitor');
            }
          } finally {
            await reader.cancel().catch(() => {});
            reader.releaseLock();
          }
        } catch {
          failed = true;
        } finally {
          if (stream !== context) return;
          stream = undefined;
          if (!stopped && !finished && identityRef.current) {
            streamRetry = setTimeout(openStream, failed ? 1000 : 0);
            if (failed) scheduleMonitor(0);
          }
        }
      })();
    }
    sendRef.current = (message) => {
      if (finished) {
        if (message.type === 'LEAVE_ROOM') leaveFinishedRoom();
        return;
      }
      if (sending || stopped) return;
      sending = true;
      monitor?.abort();
      if (message.type === 'LEAVE_ROOM') {
        stream?.controller.abort();
        stream = undefined;
        clearTimeout(streamRetry);
      }
      setBusy(true);
      setError(null);
      void request(message, 'command').finally(() => {
        sending = false;
        if (!stopped) {
          setBusy(false);
          openStream();
          scheduleMonitor(identityRef.current ? (stream?.online ? 15_000 : 500) : 15_000);
        }
      });
    };
    void (async () => {
      const current = identityRef.current;
      if (current) await request({ type: 'RECONNECT', token: current.token }, 'command');
      else await request(null, 'monitor');
      openStream();
      scheduleMonitor(identityRef.current ? 500 : 15_000);
    })();
    function resume() {
      if (document.visibilityState === 'visible') {
        openStream();
        scheduleMonitor(0);
      }
    }
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('online', resume);
    return () => {
      stopped = true;
      clearTimeout(finishExit);
      sendRef.current = null;
      clearTimeout(timer);
      clearTimeout(streamRetry);
      command?.abort();
      monitor?.abort();
      stream?.controller.abort();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('online', resume);
    };
  }, []);
  const send = useCallback((message: ClientMessage) => sendRef.current?.(message), []);
  return { room, identity, status, error, busy, send, clearError: () => setError(null) };
}
