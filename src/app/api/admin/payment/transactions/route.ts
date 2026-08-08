import { NextRequest, NextResponse } from 'next/server';
import { paymentServiceClient } from '@/lib/paymentServiceClient';
import { authorizeAdminProxy } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const auth = await authorizeAdminProxy(req);
    if (!auth.ok) {
      return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
    }
    const authHeader = auth.authHeader;
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString();
    const url = '/api/admin/payment/transactions' + (queryString ? `?${queryString}` : '');
    const result = await paymentServiceClient.proxyGET(url, authHeader);
    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error('API admin transactions:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Erreur proxy transactions', total: 0, transactions: [] },
      { status: 500 }
    );
  }
}
