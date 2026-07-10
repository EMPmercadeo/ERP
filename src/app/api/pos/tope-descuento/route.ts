import { NextResponse } from 'next/server';
import { getTenantContext } from '@/lib/auth/context';
import { obtenerTopeDescuentoSinAutorizacion } from '@/lib/services/discountAuth';

/**
 * Tope de descuento (%) que el usuario de la sesión actual puede aplicar en el POS sin
 * necesitar el PIN de un admin/gerente. Se usa solo para la UI (mostrar el aviso antes de
 * cobrar); la validación real y obligatoria ocurre siempre en POST /api/pos/ventas.
 */
export async function GET() {
  try {
    const { empresaId, userId } = await getTenantContext();
    const tope = await obtenerTopeDescuentoSinAutorizacion(empresaId, userId);
    return NextResponse.json({ tope });
  } catch {
    return NextResponse.json({ error: 'Debes iniciar sesión.' }, { status: 401 });
  }
}
