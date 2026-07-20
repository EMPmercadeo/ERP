# Auditoría — ERP Panamá

**Fecha:** 2026-07-12
**Alcance:** Verificación de hallazgos de auditorías previas (`AUDITORIA_SEGURIDAD.md` 2026-07-04, `AUDITORIA_2026-07-11.md`) contra el estado real del código + nuevo lint de React Compiler (`eslint-config-next` 16.2.10) + `npm audit`.
**Modo:** autónomo, en worktree aislado (`worktree-audit-erp-panama`), sin tocar producción.

---

## Resumen ejecutivo

Los dos hallazgos críticos y el medio de `AUDITORIA_SEGURIDAD.md` (2026-07-04) **ya estaban corregidos** al momento de esta auditoría — se verificó contra el código actual, no se asumió nada de los documentos viejos. Las correcciones de concurrencia de `AUDITORIA_2026-07-11.md` siguen en el código. `npm audit` bajó de 1 crítica + 10 altas a **0 críticas/altas, 9 moderadas** (todas en dependencias transitivas, sin fix seguro disponible — ver abajo). El hallazgo nuevo de esta pasada es un lote de **48 errores de ESLint** de las reglas `react-hooks/*` (React Compiler) que no existían en la última verificación de lint limpio — aparecieron al subir `eslint-config-next` a `16.2.10` junto con `next`. **No rompen el build** (`next build --webpack` compila con exit 0), pero son deuda técnica real. Corregí los **7 casos seguros y completamente entendidos** (incluyendo un bug real de sesión no explicada por el lint) y dejé documentados los **41 restantes** como tarea separada — no los toqué en bloque porque requieren revisión visual componente por componente en un ERP transaccional, y el propio historial de este proyecto (`PROGRESS.md`, sesión 2026-07-10) ya estableció que ese tipo de limpieza masiva de lint se hace archivo por archivo con verificación real, no de forma automática y ciega.

---

## 1. Verificación de hallazgos previos (nada nuevo se rompió)

| Hallazgo (fecha origen) | Estado verificado hoy |
|---|---|
| 🔴 Bypass de auth vía `setSessionEmail` sin verificar Firebase (07-04) | **Corregido.** `src/lib/actions/auth.ts` ya no tiene `setSessionEmail`; usa `session_token` + `adminAuth` (Firebase Admin) — confirma commits `8bf2328`/`9525643` de memoria previa. |
| 🔴 Webhook PayPal sin verificar firma (07-04) | **Corregido.** `src/app/api/v1/providers/webhooks/paypal/route.ts` ahora llama a `verify-webhook-signature` de PayPal antes de procesar cualquier evento. |
| 🟡 `/api/v1/seed-demo-suppliers` sin control de rol, con GET (07-04) | **Corregido.** Ahora exige `role === 'admin' \|\| 'super_admin'` y solo acepta `POST`. |
| 🔴/🔴 Folios duplicados + bypass de cuota bajo concurrencia (07-11) | **Sigue corregido** (`increment`/`upsert` atómicos en `invoiceCreation.ts`, `billing.ts`). |
| `npm audit`: 1 crítica + 10 altas (07-04) | **Bajó a 0 críticas/altas, 9 moderadas** (ver sección 3). |

No se re-verificó a fondo lo que ya estaba marcado como "pendiente de decisión del usuario" en memoria (sistema dual DGI sin reconciliar, `PAC_INTEGRATION_ENABLED` ausente a propósito, rate limiting en memoria, saldo de cuota negativo bajo ráfaga extrema, webhook Yappy) — nada en esta pasada indica que esas decisiones ya se tomaron, así que siguen abiertas tal como estaban.

---

## 2. Hallazgo nuevo: 48 errores de ESLint (`react-hooks/*`, reglas de React Compiler)

Al subir `next`/`eslint-config-next` a `16.2.10` (ya reflejado en `package.json`, no lo hice yo) se activaron por defecto reglas nuevas del plugin `eslint-plugin-react-hooks` orientadas a que el código sea compatible con React Compiler. `npx eslint .` pasó de **0 problemas** (cierre confirmado en `PROGRESS.md`, sesión 2026-07-10) a **48 errores**, repartidos así:

| Regla | Cantidad | Naturaleza |
|---|---|---|
| `react-hooks/set-state-in-effect` | 36 | Mayoría: patrones "resetear/derivar estado cuando cambia una dependencia" dentro de `useEffect` (limpiar sugerencias, resetear formularios al cerrar modal, cargar datos al montar). Válidos en runtime, mejorable en estilo. |
| `react-hooks/immutability` | 3 | 1 falso positivo confirmado (mutación de acumuladores `let` dentro de un **Server Component** sin hooks — el análisis del compiler no aplica ahí). 2 en `pos/page.tsx` son una referencia hacia adelante a funciones `const` declaradas más abajo en el mismo componente (funciona en runtime porque el efecto se ejecuta después de que el componente completa su render, pero es frágil). |
| `react-hooks/purity` | 3 | 2 son `Date.now()` dentro de manejadores de evento (no durante render — probable falso positivo). 1 era un inicializador de `useState` no perezoso (`useState(new Date(...))`, sí se re-evalúa en cada render) — **corregido**. |
| `react-hooks/refs` | 5 | Lectura de `ref.current` directamente en el JSX de retorno de `AuthProvider` — **corregido**, y de paso reveló un bug real (ver abajo). |
| `react-hooks/error-boundaries` | 1 | Construcción de JSX dentro de un `try/catch` en `layout.tsx` — **corregido**. |

**Build:** confirmado que `next build --webpack` compila con éxito (exit 0) tanto antes como después de estas correcciones — estos 48 hallazgos son de lint, no bloquean producción.

### 2.1 Corregidos en esta sesión (7 de 48)

**`src/lib/firebase/auth.tsx` — bug real + 5 errores de `react-hooks/refs`**
El `AuthContext.Provider` leía `mockUserRef.current` directamente en el JSX (`user: user \|\| mockUserRef.current`). Investigando por qué, encontré que en `signOut()` se limpiaba `mockUserRef.current = null` pero **nunca se llamaba `setUser(null)`** — en todos los demás puntos donde se muta `mockUserRef.current` (líneas de sincronización de usuario mock en desarrollo) sí se acompaña de `setUser(...)`, excepto en `signOut`. Efecto real: en modo desarrollo con `ALLOW_DEV_FALLBACK=true`, al cerrar sesión el estado `user` de React quedaba con el usuario simulado anterior — la UI podía seguir mostrando la sesión "activa" tras el logout hasta el siguiente evento que forzara un re-render. Con `setUser(null)` agregado en `signOut`, el estado `user` de React queda como fuente única de verdad y el JSX ya no necesita leer el ref directamente.
**Archivo:** `src/lib/firebase/auth.tsx` (líneas de `signOut` y del `return` del `AuthContext.Provider`). Solo afecta el flujo de desarrollo (`NODE_ENV=development` + `ALLOW_DEV_FALLBACK=true`); no toca producción.

**`src/app/layout.tsx` — 1 error de `react-hooks/error-boundaries`**
`ImpersonationWrapper` construía el JSX de `<ImpersonationBanner />` dentro del mismo `try` que hacía las consultas a `getTenantContext()`/Prisma. Se movió la construcción del JSX fuera del `try/catch` (se captura solo el dato `tenantName` adentro); mismo comportamiento, ahora un error real de render no queda enmascarado como si fuera un error de datos.

**`src/components/purchases/NewPurchaseForm.tsx` — 1 error de `react-hooks/purity`**
`useState(new Date(Date.now() + 30*24*60*60*1000)...)` recalculaba la fecha en cada render (el argumento de `useState` se evalúa siempre, no solo al montar). Cambiado a inicializador perezoso `useState(() => ...)` — mismo valor inicial, ya no se re-ejecuta en cada render.

**Verificación:** `tsc --noEmit` limpio, `eslint .` bajó de 48 → 41 (exactamente los 7 tocados), `next build --webpack` exitoso tras los cambios.

### 2.2 NO corregidos — quedan como tarea separada (41 de 48)

Decisión deliberada de no tocarlos en este pase:

- **36 `set-state-in-effect`**: están repartidos en 25+ componentes de UI activa (POS, facturas, RRHH, settings, reportes, etc.). El fix "correcto" por componente (mover el reseteo de estado fuera del efecto, o a un patrón de "estado derivado durante el render") cambia el flujo de renders de cada componente y en un ERP transaccional eso debería verificarse visualmente uno por uno, no reescribirse a ciegas en un solo pase sin navegador. Coincide con el precedente ya sentado en `PROGRESS.md` (sesión 2026-07-10): la limpieza masiva de lint de este proyecto se hace archivo por archivo con verificación real, no automatizada.
- **2 `immutability` en `pos/page.tsx`** (líneas ~250-251): `cargarProductos()`/`cargarTurno()` se llaman en un `useEffect` antes de su declaración textual (`const cargarProductos = ...` más abajo en el mismo componente). Funciona en runtime (el efecto corre después de que el componente completo termina de ejecutar), pero requeriría reordenar funciones dentro de un archivo grande y de alto riesgo (POS financiero) — no se tocó sin poder probarlo visualmente.
- **1 `immutability` en `suppliers/page.tsx:60`**: mutación de acumulador `let` dentro de un **Server Component** (sin hooks, sin re-render de cliente) — muy probablemente falso positivo del analizador (asume reglas de React Compiler que no aplican a Server Components). No se tocó.
- **2 `purity`** (`InvoiceForm.tsx:183`, `pos/page.tsx:541`): `Date.now()` usado dentro de manejadores de evento (`addProduct`, submit del formulario), no durante el render — probable falso positivo, mismo patrón que el anterior. No se tocó.

**Recomendación:** abordar los 36 `set-state-in-effect` en una sesión dedicada (como se hizo con los 535 problemas de `no-explicit-any` en 2026-07-10), con `npm run dev` corriendo y verificación visual de cada pantalla tocada.

---

## 3. `npm audit` — 9 moderadas, sin fix seguro disponible

Bajó de 1 crítica + 10 altas (07-04) a 0 críticas/altas. Las 9 moderadas restantes son **transitivas** y sin parche compatible:

- **`postcss` (vía `next/node_modules/postcss`)**: XSS en la serialización de CSS. El único fix de `npm audit fix --force` es **degradar `next` a `9.3.3`** (versión de hace años) — claramente peor que el problema. Es la copia interna de PostCSS que usa el propio tooling de build de Next, no el pipeline de Tailwind de la app.
- **`uuid` (vía `exceljs`/`gaxios`/`teeny-request`/`firebase-admin`/`@google-cloud/storage`)**: falta de chequeo de límites en v3/v5/v6 cuando se provee un buffer propio. El fix de `npm audit fix --force` **degradaría `exceljs` a `3.4.0`**, rompiendo la importación de CSV/Excel de productos/movimientos bancarios (funcionalidad real en uso). No se llama a `uuid` con buffers controlados por el usuario en este proyecto.

No apliqué `npm audit fix --force` — ambos "fixes" son downgrades que rompen funcionalidad real a cambio de vulnerabilidades moderadas en rutas no explotables aquí. Recomendación: monitorear si `exceljs`/`firebase-admin`/`next` publican una versión que actualice su dependencia de `uuid`/`postcss` sin downgrade.

---

## Archivos modificados en esta sesión

- `src/lib/firebase/auth.tsx` (bug de sesión en `signOut` + fix de lint)
- `src/app/layout.tsx` (fix de lint)
- `src/components/purchases/NewPurchaseForm.tsx` (fix de lint)
- Este documento (`AUDITORIA_2026-07-12.md`)

Verificado: `tsc --noEmit` sin errores, `next build --webpack` exitoso, `eslint .` 48→41 (sin regresiones nuevas).
