import { NextRequest, NextResponse } from 'next/server';
import { procesarAlertasOperativas } from '@/lib/services/alertasOperativas';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'Falta CRON_SECRET.' }, { status: 503 });
  if (request.headers.get('authorization') !== `Bearer ${secret}`)
    return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  try {
    return NextResponse.json({ success: true, ...(await procesarAlertasOperativas()) });
  } catch (error) {
    console.error('GET alertas-operativas', error);
    return NextResponse.json({ error: 'No se pudieron procesar las alertas.' }, { status: 500 });
  }
}
