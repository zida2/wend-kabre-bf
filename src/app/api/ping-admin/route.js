import { getAdminDb } from '@/lib/firebaseAdmin';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({ ping: 'admin', configured: !!getAdminDb() });
}
