import { healthGet } from '../../apps/server/src/http-gateway';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  return healthGet();
}
