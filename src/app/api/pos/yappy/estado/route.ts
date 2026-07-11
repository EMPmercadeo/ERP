import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';

/**
 * Le dice al POS si esta empresa tiene Yappy Comercial configurado y habilitado, para decidir
 * si mostrar el botón real de cobro (Botón de Pago Yappy V2) o el flujo manual de referencia.
 * Nunca expone la clave secreta, solo si existe.
 */
export async function GET() {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
    }

    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { yappyEnabled: true, yappyMerchantId: true, yappySecretKey: true, yappyDomain: true, yappyAmbiente: true }
    });

    const disponible = !!(
      process.env.YAPPY_INTEGRATION_ENABLED === 'true' &&
      empresa?.yappyEnabled &&
      empresa.yappyMerchantId &&
      empresa.yappySecretKey &&
      empresa.yappyDomain
    );

    return NextResponse.json({
      disponible,
      ambiente: empresa?.yappyAmbiente === 'produccion' ? 'produccion' : 'pruebas'
    });
  } catch (error) {
    console.error('Error GET /api/pos/yappy/estado:', error);
    return NextResponse.json({ disponible: false });
  }
}
