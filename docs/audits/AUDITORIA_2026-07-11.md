# Auditoría de arquitectura — ERP Panamá

**Fecha:** 2026-07-11
**Alcance:** Seguridad · Escalabilidad/rendimiento · Integridad/correctitud · Limpieza de carpeta
**Modo:** autónomo (decisiones estándar de industria aplicadas directamente al código)

---

## Resumen ejecutivo

El código base ya venía endurecido en seguridad (RBAC por endpoint, aislamiento multi-tenant, sin SQL raw, validación Zod, nómina 2026 correcta). Los hallazgos de esta pasada se concentraron en **condiciones de carrera de concurrencia** en las rutas de facturación/POS (folios y ledger de cuota), que corregí con operaciones atómicas de Prisma. También limpié la carpeta de basura y confirmé la configuración de pooling e índices.

**No se requirieron migraciones de schema** (los índices ya cubren los patrones de consulta reales).

> ⚠️ **Verificación pendiente en TU máquina.** Este entorno de auditoría es Linux y el proyecto trae `node_modules` compilado para Windows (Prisma engine, esbuild), así que **no pude correr `prisma generate` ni el `build` aquí** (fallan por binario de plataforma / descarga de engine bloqueada). Las correcciones están aplicadas y verificadas por inspección y por tipos (todos los campos tocados son `Int`, API estándar de Prisma). Debes correr en Windows: `npx prisma generate` y luego `npm run build` para confirmar tipos y compilación. Ver "Cómo cerrar" al final.

---

## 1. Correcciones aplicadas (por severidad)

### 🔴 ALTA — Folios/facturas duplicados bajo concurrencia
**Qué:** `getNextSequence` leía el último número en JS y luego lo escribía (`read-then-write`). Dos cajas emitiendo simultáneamente leían el mismo `ultimoNumero` y ambas escribían `N+1` → **folios duplicados** (violación fiscal DGI y de unicidad de secuencia).
**Fix:** reemplazado por `upsert` + `{ ultimoNumero: { increment: 1 } }`, que Postgres compila a `SET ultimoNumero = ultimoNumero + 1` a nivel de fila (atómico). Se eliminó el `$transaction` manual que ya no aporta.
**Archivos:**
- `src/lib/services/invoiceCreation.ts:73` (facturas FE/REC — fuente única de verdad de UI, POS y API externa)
- `src/lib/actions/delivery-notes.ts:12` (albaranes)
- `src/lib/actions/sales-orders.ts` (pedidos de venta)

### 🔴 ALTA — Bypass del ledger de cuota de documentos (double-consume)
**Qué:** `incrementDocumentUsage` hacía `read usedDocuments → +1 en JS → write`. Dos facturas concurrentes leían el mismo valor y ambas escribían `N+1`: se emitían 2 documentos pero el contador subía solo 1 → la empresa **consumía cuota sin registrarla** (bypass del límite mensual del plan).
**Fix:** consumo atómico `{ usedDocuments: { increment: 1 }, remainingDocuments: { decrement: 1 } }`.
**Archivo:** `src/lib/actions/billing.ts:135`

### 🟠 MEDIA — Ledger de saldo DGI con valores antes/después inconsistentes (POS)
**Qué:** en la emisión POS, el movimiento de cuota (`MovimientoCuota`) registraba `saldoAnte`/`saldoPost` tomados de una lectura de `cuenta` hecha **fuera de toda transacción** (líneas arriba del `create`). Bajo emisiones concurrentes, dos ventas capturaban el mismo saldo previo y el rastro de auditoría del ledger quedaba con saltos repetidos (p.ej. dos movimientos "5→4") aunque el saldo real bajara 5→4→3.
**Fix:** el `$transaction` ahora decrementa el saldo de forma atómica y **relee el saldo ya decrementado dentro de la misma transacción** para calcular `saldoAnte`/`saldoPost` reales. Convertido de `$transaction([...])` (array) a transacción interactiva `async (tx) => {...}`.
**Archivos:**
- `src/app/api/pos/ventas/route.ts:242`
- `src/app/api/pos/ventas/sync/route.ts:206`

### 🟡 BAJA — `catch {}` silenciosos en descuento de stock (POS)
**Qué:** dos bucles de descuento de inventario tragaban cualquier error sin loggear (`} catch {}`). Un fallo al descontar stock quedaba invisible.
**Fix:** los `catch` ahora hacen `console.error` con `productoId` y `ventaId`.
**Archivo:** `src/app/api/pos/ventas/route.ts` (bloques offline y online, ~líneas 289 y 291 tras el cambio)

### 🟡 BAJA — Prevención de regresión del cliente Prisma desactualizado
**Qué (de la sesión anterior, incluido aquí):** al actualizar el schema, `next dev` no regeneraba el cliente Prisma y aparecían 42 errores de tipo (modelos `TurnoCaja`/`YappyOrden`/campos `yappy*`). Root cause: cliente generado obsoleto, no bugs de código.
**Fix:** agregados hooks `postinstall` y `predev` → `prisma generate` en `package.json`, para que el cliente se regenere solo tras instalar y antes de `dev`.
**Archivo:** `package.json:5`

---

## 2. Migraciones de schema aplicadas

**Ninguna.** Revisé `prisma/schema.prisma` (131 índices/uniques) contra los patrones de consulta reales del código y los modelos nuevos ya están correctamente indexados:
- `TurnoCaja`: `@@index([empresaId, estado])`, `@@index([usuarioId, estado])` → cubre el `findFirst` de apertura/venta.
- `Venta`: `@@index([empresaId, createdAt])` (listado POS), `@@index([turnoCajaId])` (cierre de turno).
- `MovimientoCuota`: `@@index([cuentaId, createdAt])`.

No agregué índices especulativos: cada índice tiene costo de escritura y una migración no probada aquí sería más riesgo que beneficio. La indexación existente es adecuada.

---

## 3. Archivos borrados en la limpieza

| Archivo/carpeta | Qué era | Trackeado en git |
|---|---|---|
| `.trash_bin/` (1.2 MB) | Papelera del sistema de sync: locks git stale, `__sync_test*.txt`, y scripts descartados (`check_dgi_statuses.ts`, `insert_dgi_data.js`, `test-dashboard.js`, `test-isolation.ts`, `unpack.js`, `verify_all.js`, `unpacked-app/`, `unpacked-mockup/`) | No |
| `dashboard-after-desktop.png`, `dashboard-after-mobile.png`, `dashboard-after-tablet.png` | Screenshots de desarrollo | No |
| `dashboard-verified-mobile.png`, `dev-dashboard-screenshot.png`, `login-verified-mobile.png`, `root-mobile.png` | Screenshots de desarrollo (recuperables del historial git) | Sí |
| `suppliers_hit.log` | Log de debug (recuperable del historial git) | Sí |
| `tsconfig.tsbuildinfo` | Caché incremental de TS (se regenera solo) | No |
| `scratch/` | Carpeta vacía | No |
| `C:\Users\ermom\...\erp-panama` (dir anidado) | Carpeta vacía creada por error con un nombre de ruta literal de Windows | No |

**Conservado a propósito:** `design-review-package/` y `design-review-package.zip` — el `CLAUDE.md` los marca como snapshot congelado de UI ("never edit"), así que no los toqué aunque el `.zip` sea un artefacto.

Los archivos trackeados borrados aparecen como `D` en `git status` y siguen recuperables desde el historial de git si alguno resultara necesario.

---

## 4. Pendiente por decisión tuya (riesgo / cambio de semántica)

1. **Saldo de cuota DGI negativo bajo concurrencia extrema (POS).** Entre el chequeo `saldoFacturas <= 0` y el decremento hay una llamada lenta al PAC. Dos ventas concurrentes con saldo=1 pueden ambas emitir y dejar el saldo en −1. El fix real es **reservar la cuota antes de emitir** (reserve-before-emit) y devolverla si el PAC rechaza — eso cambia la semántica del flujo de pago y no debería aplicarse a ciegas sin poder probarlo. *Recomendación:* implementar reserva atómica previa (`updateMany where saldoFacturas > 0 → decrement`, abortar si `count === 0`) en una rama con pruebas.

2. **Cuota mensual de documentos: excedente por ráfaga simultánea.** El `increment` atómico ya elimina la corrupción del contador, pero el patrón "chequear `canCreateInvoice` y luego incrementar" puede permitir exceder el límite por unos pocos documentos en una ráfaga concurrente. El cierre total requiere una guarda con comparación columna-a-columna (`usedDocuments < includedLimit + extraDocumentsPurchased`) en SQL raw, que Prisma no expresa y que preferí no introducir sin poder ejecutarla aquí.

3. **Firebase Web API key hardcodeada** en `src/lib/firebase/index.ts:18`. **No es un secreto** — las API keys web de Firebase son públicas por diseño (viajan en el bundle del cliente, identifican el proyecto, no autentican), así que **no requiere rotación**. *Recomendación de higiene:* moverla a `NEXT_PUBLIC_FIREBASE_API_KEY`. No lo hice para no arriesgar romper el login si esa variable no está definida en Vercel.

4. **Rate limiting en memoria** (`src/middleware.ts`). El `Map` por instancia no se comparte entre instancias serverless de Vercel, así que el límite real es más laxo bajo escala. *Recomendación:* respaldar con Upstash/Redis para un límite global consistente. No es un bug, pero sí una limitación conocida.

5. **Webhook Yappy — sobreescritura de estado.** `src/app/api/v1/providers/webhooks/yappy/route.ts` valida bien el HMAC por empresa (no forjable) y es idempotente, pero permite pasar de `EJECUTADO` a `CANCELADO`/`RECHAZADO` con una IPN posterior aunque el POS ya haya creado la Venta. Es un caso de borde de negocio: decidir si el estado debe congelarse una vez ejecutado.

---

## Cómo cerrar (en tu máquina Windows)

```powershell
cd C:\Users\ermom\.gemini\antigravity\scratch\erp-panama
npx prisma generate      # regenera el cliente (arregla los 42 errores de tipo pendientes)
npm run build            # confirma tipos + compilación (corre prisma generate + migrate deploy)
```

Si `npx` intenta instalar Prisma 7, usa el binario local: `node_modules\.bin\prisma generate`.

> **Nota sobre la sesión paralela (Gemini/Antigravity):** durante la auditoría, `package.json` apareció truncado en el mount por una escritura concurrente de la otra sesión. Lo reescribí completo y válido desde el host. Antes de pushear, confirma con `git diff package.json` que solo tiene los cambios esperados (los hooks `postinstall`/`predev`) y ejecuta solo una sesión a la vez sobre este repo para evitar pisar cambios.

## Verificación ya realizada en esta auditoría
- ESLint del código completo: **limpio** (antes de las ediciones; los cambios usan API estándar de Prisma).
- Sin SQL raw en toda la base (`$queryRaw`/`$executeRaw`): **0 ocurrencias** → sin superficie de inyección.
- RBAC: las 68 rutas API referencian `getTenantContext`/`requireSuperAdmin`/verificación de webhook.
- Aislamiento multi-tenant: endpoints de RRHH por `[id]` verifican `empleado.empresaId === empresaId`; `crearFacturaCompleta` valida que cliente y productos pertenezcan a la empresa.
- Nómina Ley 462: constantes CSS verificadas contra la ley (obrero 9.75%; patronal 13.25% abr-2025→feb-2027, 14.25% hasta feb-2029, 15.25% después). **Correctas.**
- Pooling Supabase: `src/lib/db.ts` inyecta `connection_limit=3` + `pool_timeout=15` y reutiliza el singleton warm. **Adecuado para serverless.**
- Tipos de campos tocados (`saldoFacturas`, `saldoAnte`, `saldoPost`, `ultimoNumero`, `usedDocuments`, `remainingDocuments`): todos `Int` → aritmética de los fixes type-safe.
