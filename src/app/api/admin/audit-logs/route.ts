import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || undefined;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Accès administrateur authentifié requis.' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = '/api/admin/audit-logs' + (queryString ? `?${queryString}` : '');
    const result = await paymentServiceClient.proxyGET(url, authHeader);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API admin audit-logs:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur proxy audit logs', total: 0, logs: [] },
      { status: 500 }
    );
  }
}
