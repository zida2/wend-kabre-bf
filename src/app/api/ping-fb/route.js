import { db } from '@/lib/firebase';
export const dynamic = 'force-dynamic';
export async function GET() {
  return Response.json({ ping: 'fb', dbDefined: !!db });
}
