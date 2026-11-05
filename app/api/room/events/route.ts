import { roomEventsPost } from '../../../../apps/server/src/room-events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
export async function POST(request: Request) {
  return roomEventsPost(request);
}
