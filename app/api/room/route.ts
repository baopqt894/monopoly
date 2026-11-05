import { roomPost } from '../../../apps/server/src/http-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function POST(request: Request) {
  return roomPost(request);
}
