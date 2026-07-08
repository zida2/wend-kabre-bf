import { getAdminDb } from '@/lib/firebaseAdmin';
export const dynamic = 'force-dynamic';
export async function GET() {
  const adminDb = await getAdminDb();
  return Response.json({ ping: 'admin', configured: !!adminDb });
}
