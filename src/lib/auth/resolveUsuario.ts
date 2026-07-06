import { prisma } from '@/lib/db';
import type { Usuario } from '@prisma/client';

/**
 * Única fuente de verdad para resolver un Usuario a partir de un email de Firebase.
 *
 * Antes de este archivo existían dos implementaciones divergentes:
 * - `getTenantContext()` (server, usado por layouts/admin) hacía match case-insensitive.
 * - `getUserRole()`/`getCurrentUser()` (usados por el hook `useAuth()` en el cliente)
 *   hacían `findUnique({ where: { email } })`, un match EXACTO y case-sensitive.
 *
 * Si el email que devuelve el SDK de Firebase en el cliente no coincidía carácter
 * a carácter con el valor guardado en Postgres, el rol se resolvía correctamente
 * server-side pero quedaba `null`/`undefined` en el cliente — el bug reportado de
 * "el rol superadmin no se refleja en algunas pestañas" (las pestañas afectadas eran
 * las que dependen de `useAuth().role` en vez del contexto server).
 *
 * Toda resolución de Usuario por email en el proyecto debe pasar por esta función.
 */
export async function resolveUsuarioPorEmail(
  email: string | null | undefined
): Promise<Usuario | null> {
  if (!email) return null;
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return null;

  return prisma.usuario.findFirst({
    where: { email: { equals: normalized, mode: 'insensitive' } },
  });
}
