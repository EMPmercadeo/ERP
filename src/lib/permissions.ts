/**
 * Único lugar donde se define qué puede ver/hacer cada rol DENTRO de una misma empresa
 * (equipo del dueño). El rol de plataforma 'super_admin' se maneja aparte (Sidebar +
 * admin/layout.tsx) y siempre tiene acceso total vía impersonación.
 *
 * 'admin' = el dueño de la empresa (o quien él designe con ese rol) siempre ve todo.
 * Los demás roles se restringen por módulo según RUTA_ROLES abajo.
 *
 * Esto se usa tanto en el cliente (Sidebar, para ocultar enlaces) como en el servidor
 * (rutas /api/** y páginas server component, para bloquear el acceso real). Ocultar en
 * el menú por sí solo NO es seguridad — cada endpoint sensible debe llamar
 * puedeVerRuta()/puedeAutorizarDescuentos() también del lado servidor.
 */

export type AppRole = 'admin' | 'gerente' | 'contador' | 'vendedor';

export const ASSIGNABLE_ROLES: AppRole[] = ['admin', 'gerente', 'contador', 'vendedor'];

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: 'Administrador (Dueño)',
  gerente: 'Gerente',
  contador: 'Contador',
  vendedor: 'Vendedor',
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: 'Acceso total a todos los módulos, configuración y autorización de descuentos.',
  gerente: 'Como el dueño, pero pensado para un encargado de confianza. Puede autorizar descuentos especiales con su PIN.',
  contador: 'Ve Planilla/RRHH, Facturas, Reportes y Bancos. No ve Ventas (POS) ni Compras.',
  vendedor: 'Ve Ventas (POS, Cotizaciones, Pedidos, Facturas, Clientes) y el catálogo de Productos (inventario). No ve Compras, Finanzas ni RRHH.',
};

// Roles que pueden autorizar con su propio PIN un descuento que excede el tope normal.
export const ROLES_AUTORIZAN_DESCUENTOS: AppRole[] = ['admin', 'gerente'];

// Mapa de ruta (href tal como aparece en la Sidebar) -> roles que pueden verla/usarla.
// Si una ruta no aparece aquí, se considera neutra (dashboard, perfil, configuración,
// ayuda) y cualquier usuario autenticado de la empresa puede verla.
export const RUTA_ROLES: Record<string, AppRole[]> = {
  '/pos': ['admin', 'gerente', 'vendedor'],
  '/quotes': ['admin', 'gerente', 'vendedor'],
  '/orders': ['admin', 'gerente', 'vendedor'],
  '/delivery-notes': ['admin', 'gerente', 'vendedor'],
  '/invoices': ['admin', 'gerente', 'vendedor', 'contador'],
  '/clients': ['admin', 'gerente', 'vendedor'],
  '/suppliers': ['admin', 'gerente'],
  '/purchases': ['admin', 'gerente'],
  '/products': ['admin', 'gerente', 'vendedor'],
  '/warehouses': ['admin', 'gerente'],
  '/warehouses/transfers': ['admin', 'gerente'],
  '/bank-accounts': ['admin', 'gerente', 'contador'],
  '/reports': ['admin', 'gerente', 'contador'],
  '/rrhh/empleados': ['admin', 'gerente', 'contador'],
  '/rrhh/ausencias': ['admin', 'gerente', 'contador'],
  '/payroll': ['admin', 'gerente', 'contador'],
};

function esRolConocido(rol: string): rol is AppRole {
  return (ASSIGNABLE_ROLES as string[]).includes(rol);
}

/**
 * ¿Puede este rol ver/usar esta ruta? `super_admin` (plataforma) y `admin` (dueño de la
 * empresa) siempre tienen acceso total. Un rol desconocido/ausente no tiene acceso a
 * rutas restringidas, pero sí a las neutras (no listadas en RUTA_ROLES).
 */
export function puedeVerRuta(rol: string | null | undefined, href: string): boolean {
  if (rol === 'super_admin' || rol === 'admin') return true;

  const restriccion = RUTA_ROLES[href];
  if (!restriccion) return true; // ruta neutra, no restringida por rol

  if (!rol || !esRolConocido(rol)) return false;
  return restriccion.includes(rol);
}

export function puedeAutorizarDescuentos(rol: string | null | undefined): boolean {
  return rol === 'admin' || (esRolConocido(rol || '') && ROLES_AUTORIZAN_DESCUENTOS.includes(rol as AppRole));
}
