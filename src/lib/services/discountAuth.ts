import { compare } from 'bcryptjs';
import { prisma } from '@/lib/db';
import { puedeAutorizarDescuentos } from '@/lib/permissions';

/**
 * Verifica el PIN de un admin/gerente para autorizar un descuento que excede el tope
 * normal del vendedor. El admin autorizador SIEMPRE debe pertenecer a la MISMA empresa
 * que está haciendo la venta (empresaId de la sesión del vendedor) — nunca se confía en
 * un empresaId que venga del cliente para esta verificación.
 *
 * Devuelve el usuario autorizador si el PIN es válido, o null si no lo es / no aplica.
 */
export async function verificarPinAutorizacion(
  empresaId: string,
  adminEmail: string,
  pin: string
): Promise<{ id: string; nombre: string; rol: string } | null> {
  if (!adminEmail || !pin) return null;

  const admin = await prisma.usuario.findFirst({
    where: {
      empresaId,
      email: adminEmail.trim().toLowerCase(),
      activo: true,
    },
  });

  if (!admin) return null;
  if (!puedeAutorizarDescuentos(admin.rol)) return null;
  if (!admin.pinAutorizacion) return null;

  const valido = await compare(pin, admin.pinAutorizacion);
  if (!valido) return null;

  return { id: admin.id, nombre: admin.nombre, rol: admin.rol };
}

/**
 * Tope de descuento (%) que un usuario puede aplicar sin necesitar autorización de un
 * admin/gerente: su propio tope si lo tiene configurado, si no el tope general de la
 * empresa (Empresa.descuentoMaximoSinAutorizacion, default 10%).
 */
export async function obtenerTopeDescuentoSinAutorizacion(
  empresaId: string,
  userId: string
): Promise<number> {
  const [usuario, empresa] = await Promise.all([
    prisma.usuario.findUnique({ where: { id: userId }, select: { descuentoMaximoPermitido: true, rol: true } }),
    prisma.empresa.findUnique({ where: { id: empresaId }, select: { descuentoMaximoSinAutorizacion: true } }),
  ]);

  // El dueño (admin) y quien tenga permiso de autorizar no necesita autorizarse a sí mismo.
  if (usuario && puedeAutorizarDescuentos(usuario.rol)) return 100;

  if (usuario?.descuentoMaximoPermitido != null) return Number(usuario.descuentoMaximoPermitido);
  return Number(empresa?.descuentoMaximoSinAutorizacion ?? 10);
}
