import { createHash } from 'node:crypto';
import { HttpRoomService } from './http-room-service';
import { getRoomStore, type RoomStore } from './room-store';
import { logRoomFailure } from './room-diagnostics';
import { mobileMessage, wantsMobilePresentation } from './mobile-presentation';

const headers = { 'Cache-Control': 'no-store, private' };
export async function readRoomRequest(request: Request): Promise<unknown | Response> {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  // Next.js can use its internal bind address in request.url. The incoming Host
  // identifies the public origin; forwarded protocol accounts for Vercel TLS termination.
  const host = request.headers.get('host') ?? url.host;
  const protocol =
    request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() ?? url.protocol.slice(0, -1);
  // Native requests negotiate with a custom header. Browsers must still use the
  // same origin, and cross-origin preflights receive no CORS permission.
  const validOrigin = origin === null ? wantsMobilePresentation(request) : origin === `${protocol}://${host}`;
  if (!validOrigin) {
    return Response.json(
      {
        messages: [
          { type: 'ERROR', code: 'INVALID_ORIGIN', message: 'Nguồn yêu cầu không hợp lệ.' },
        ],
      },
      { status: 403, headers },
    );
  }
  if (!request.headers.get('content-type')?.startsWith('application/json'))
    return new Response(null, { status: 415, headers });
  // Stream with a byte limit so chunked requests cannot bypass Content-Length checks.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400, headers });
  let text = '';
  let bytes = 0;
  const decoder = new TextDecoder();
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    bytes += chunk.value.byteLength;
    if (bytes > 16_384) {
      await reader.cancel();
      return new Response(null, { status: 413, headers });
    }
    text += decoder.decode(chunk.value, { stream: true });
  }
  text += decoder.decode();
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    return new Response(null, { status: 400, headers });
  }
  return input;
}

export function requestRateKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  return createHash('sha256').update(ip).digest('hex');
}

export function unavailableResponse(cause: unknown, operation: 'room' | 'events' = 'room'): Response {
  logRoomFailure(operation, cause);
  const missing = cause instanceof Error && cause.message === 'ROOM_STORE_NOT_CONFIGURED';
  return Response.json(
    {
      messages: [
        {
          type: 'ERROR',
          code: missing ? 'ROOM_STORE_NOT_CONFIGURED' : 'SERVER_UNAVAILABLE',
          message: missing
            ? 'Máy chủ chưa cấu hình kho phòng chơi. Vui lòng thêm MONGODB_URI trong Vercel và triển khai lại.'
            : 'Máy chủ tạm thời không phản hồi. Vui lòng thử lại.',
        },
      ],
    },
    { status: 503, headers },
  );
}

export async function roomPost(request: Request, providedStore?: RoomStore): Promise<Response> {
  const input = await readRoomRequest(request);
  if (input instanceof Response) return input;
  try {
    const store = providedStore ?? getRoomStore();
    const candidate = input as {
      roomCode?: unknown;
      message?: { type?: string; code?: string };
    } | null;
    const type = candidate?.message?.type;
    const code =
      type === 'CREATE_ROOM' && typeof (input as { requestId?: unknown }).requestId === 'string'
        ? createHash('sha256')
            .update((input as { requestId: string }).requestId)
            .digest('hex')
            .slice(0, 6)
            .toUpperCase()
        : type === 'JOIN_ROOM' && typeof candidate?.message?.code === 'string'
          ? candidate.message.code.trim().toUpperCase()
          : candidate?.roomCode;
    const readCode = typeof code === 'string' && /^[0-9A-F]{6}$/.test(code) ? code : null;
    const polling = candidate?.message === null;
    const [allowed, value] = await Promise.all([
      store.rateLimit(`${polling ? 'poll:' : ''}${requestRateKey(request)}`, polling ? 120 : 35),
      readCode ? store.read(readCode) : Promise.resolve(null),
    ]);
    // Per-IP quota includes unauthenticated create/join requests.
    if (!allowed) {
      return Response.json(
        {
          messages: [
            {
              type: 'ERROR',
              code: 'RATE_LIMIT',
              message: 'Thao tác quá nhanh. Vui lòng đợi vài giây.',
            },
          ],
        },
        { status: 429, headers },
      );
    }
    const result = await new HttpRoomService(store).handle(
      input,
      readCode ? { code: readCode, value } : undefined,
    );
    return Response.json(
      wantsMobilePresentation(request) ? { messages: result.messages.map(mobileMessage) } : result,
      { headers },
    );
  } catch (cause) {
    return unavailableResponse(cause);
  }
}

export async function healthGet(providedStore?: RoomStore): Promise<Response> {
  try {
    await (providedStore ?? getRoomStore()).ping();
    return Response.json(
      { status: 'ok', transport: 'sse', region: process.env.VERCEL_REGION ?? 'local' },
      { headers },
    );
  } catch (cause) {
    logRoomFailure('health', cause);
    return Response.json(
      { status: 'unavailable', message: 'Kho phòng chơi chưa sẵn sàng.' },
      { status: 503, headers },
    );
  }
}
