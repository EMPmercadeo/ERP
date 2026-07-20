# Auditoría de Seguridad — ERP Panamá

**Fecha:** 2026-07-04
**Alcance:** Código fuente en `src/`, `scripts/`, `prisma/`, historial de git, configuración de Vercel/Supabase (solo lectura), `npm audit`.
**Metodología:** Lectura directa del código real (no se asumió nada por convención o nombre de archivo) y, cuando fue necesario para confirmar un hallazgo, verificación de solo lectura contra la base de datos de producción (Supabase). No se modificó ningún archivo del proyecto ni se alteró la base de datos.

---

## Resumen ejecutivo

| # | Verificación | Severidad | Estado |
|---|---|---|---|
| — | **Bypass total de autenticación vía `setSessionEmail`** | 🔴 **CRÍTICO** | Vulnerable — ver "Hallazgo crítico adicional" |
| 5 | Webhook de PayPal sin verificación de firma | 🔴 **CRÍTICO** | Vulnerable |
| 7 | Tablas de Compras/Proveedores/Contabilidad sin RLS | 🟠 **ALTO** | Vulnerable (parcial) |
| 8 | Dependencias vulnerables (`npm audit`) | 🟠 **ALTO** | 1 crítica + 10 altas |
| 5 | Endpoint `/api/v1/seed-demo-suppliers` sin control de rol | 🟡 **MEDIO** | Expuesto en producción |
| 4 | Aislamiento multi-tenant (patrón check-then-act) | 🟡 **BAJO/observación** | Seguro en la práctica, no defensa en profundidad |
| 1 | Variables `NEXT_PUBLIC_` | 🟢 OK | Ninguna contiene secretos |
| 2 | Archivos `.env` en git | 🟢 OK | Nunca se subieron |
| 3 | SQL crudo en `src/` | 🟢 OK | No existe ningún uso |
| 6 | Hashing de contraseñas | 🟢 OK | bcryptjs usado correctamente |

---

## 🔴 Hallazgo crítico adicional (no estaba en la lista de 8, pero apareció al investigar el punto 5): bypass total de autenticación

Este es el hallazgo más grave de toda la auditoría, así que lo reporto primero aunque no estaba explícitamente en tu lista.

**Archivo:** `src/lib/actions/auth.ts` líneas 82-92

```ts
export async function setSessionEmail(email: string) {
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cookieStore = await cookies();
    cookieStore.set('session_email', cleanEmail, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 1 week
    });
}
```

Esta función es una **Server Action** de Next.js. Recibe un `email` como simple parámetro de texto y lo guarda tal cual en la cookie `session_email`, **sin verificar en ningún momento que ese email corresponda a una sesión de Firebase real**.

Toda la autenticación de la aplicación depende después de esa cookie: `src/lib/auth/context.ts` línea 20 hace `cookieStore.get('session_email')` y busca (o **auto-crea**, con rol `admin`, líneas 35-67) un usuario con ese email — sin volver a comprobar Firebase.

Confirmé que **no existe ninguna verificación server-side del token de Firebase en todo el proyecto**:
```
grep -rn "verifyIdToken|firebase-admin|admin\.auth\(\)" src/   →  0 resultados
grep -i "firebase-admin" package.json                          →  0 resultados
```
El paquete `firebase-admin` (el único que permite verificar un ID token de Firebase del lado del servidor) **ni siquiera está instalado**. La app confía ciegamente en lo que el cliente le diga.

En `src/lib/firebase/auth.tsx` se ve cómo se llama: después de `signInWithPopup`, `signInWithEmailAndPassword`, `onAuthStateChanged`, etc., el código del navegador simplemente hace `await setSessionEmail(res.user.email)` (líneas 141, 188, 204, 234, 249). Pero una Server Action de Next.js es, a nivel de red, un endpoint POST normal — **cualquiera puede invocarla directamente sin pasar nunca por Firebase**, enviando el email que quiera como argumento.

**Impacto:** cualquier persona que sepa (o adivine) el correo de un usuario existente —incluyendo un `super_admin`— puede llamar a `setSessionEmail("victima@empresa.com")` directamente y obtener una cookie de sesión válida para esa cuenta, sin contraseña ni token de Firebase. Esto da acceso total a los datos de esa empresa (facturas, clientes, contabilidad) y, si la víctima es `super_admin`, también a `startImpersonation()` (`src/lib/actions/impersonate.ts`) para entrar como cualquier otra empresa del sistema. Si el email no existe todavía, el sistema crea una empresa y un usuario `admin` nuevos sin verificar que el atacante sea dueño de ese correo.

Este hallazgo hace que los controles de aislamiento multi-tenant revisados en el punto 4 (que sí están bien implementados a nivel de consulta) sean irrelevantes en la práctica, porque el atacante puede simplemente convertirse en el `empresaId` legítimo que necesite.

---

## 1. Variables de entorno expuestas (`NEXT_PUBLIC_`)

Búsqueda: `grep -rn "NEXT_PUBLIC_" src/ *.config.* package.json .env*`

Todas las variables `NEXT_PUBLIC_` encontradas en el código:

| Variable | Dónde se usa | ¿Sensible? |
|---|---|---|
| `NEXT_PUBLIC_PAYPAL_CLIENT_ID` | `SettingsClient.tsx:157,1573` | No — el Client ID de PayPal está **diseñado** para ser público (se usa en el SDK del navegador); el secreto real es `PAYPAL_CLIENT_SECRET`, que **no** tiene el prefijo `NEXT_PUBLIC_` y por tanto nunca llega al navegador. Correcto. |
| `NEXT_PUBLIC_PAYPAL_PLAN_BASIC_ID` / `NEXT_PUBLIC_PAYPAL_PLAN_PRO_ID` | `SettingsClient.tsx:164-165`, `webhooks/paypal/route.ts:50-51` | No — son IDs de planes de suscripción, no secretos. |
| `NEXT_PUBLIC_PLAN_BASIC_ID` / `NEXT_PUBLIC_PLAN_PRO_ID` | `SettingsClient.tsx:164-165` (fallback) | No — mismos IDs de plan. |
| `NEXT_PUBLIC_APP_URL` | `src/middleware.ts:9` (lista de orígenes CORS permitidos) | No — es una URL pública. |

**Conclusión: ninguna variable `NEXT_PUBLIC_` contiene contraseñas, tokens ni cadenas de conexión.** No se encontró ninguna variable `NEXT_PUBLIC_DATABASE_URL`, `NEXT_PUBLIC_*_SECRET`, `NEXT_PUBLIC_*_KEY` de servicio, etc.

**Nota aparte (no es una variable `NEXT_PUBLIC_`, pero es del mismo tipo de riesgo):** la configuración del cliente de Firebase en `src/lib/firebase/index.ts:17-25` está **hardcodeada** en el código (apiKey, projectId, etc.) en lugar de usar variables de entorno. Esto es visible para cualquiera en el bundle del navegador, pero es el comportamiento esperado y documentado por Firebase: el `apiKey` de Firebase no es secreto, identifica el proyecto, y la seguridad real depende de las reglas de Firebase Auth/Firestore, no de ocultar esta clave. No es un hallazgo de severidad, solo una observación de estilo (podría moverse a `NEXT_PUBLIC_FIREBASE_*` por prolijidad, sin cambio de riesgo real).

También noté que ninguna de las variables `NEXT_PUBLIC_*` de PayPal está configurada en Vercel (`vercel env ls` no devuelve ninguna `NEXT_PUBLIC_*`), solo existen en `.env.local` (desarrollo). Esto es un posible bug funcional en producción (el botón de PayPal no se renderizaría), pero no es un hallazgo de seguridad.

---

## 2. Archivos `.env` en el historial de git

```
git log --all --full-history --oneline -- .env .env.local .env.production .env.production.local .env.preview.local .env.dev.local
```
→ **Sin resultados.**

Verificación más exhaustiva, escaneando el árbol de *todos* los commits del historial (no solo el log del path actual, por si hubo un rename):
```
git rev-list --all | xargs -I{} git ls-tree -r {} --name-only | grep -E '^\.env'
```
→ **Sin resultados.** Ningún archivo `.env*` fue subido jamás a este repositorio, en ningún commit.

`.gitignore` actual sí excluye correctamente estos archivos:
```
# env files (can opt-in for committing if needed)
.env*
...
.env*.local
```
(Aparece dos veces, de forma redundante, pero cubre el caso.)

**Conclusión: correcto.** No hay secretos filtrados en el historial de git por esta vía.

---

## 3. Consultas SQL directas (`$queryRaw` / `$executeRaw`)

```
grep -rn '\$queryRaw|\$executeRaw' src/
```
→ **0 resultados en todo `src/`.**

Toda la aplicación usa exclusivamente el query builder de Prisma (`findFirst`, `findMany`, `create`, `update`, etc.), que parametriza automáticamente los valores — no hay superficie de inyección SQL en el código de la aplicación.

El único lugar del repositorio que usa `$executeRawUnsafe` es `scripts/enable-rls.ts` (fuera de `src/`, ver punto 7), y ahí el único valor interpolado es un nombre de tabla tomado de un arreglo **hardcodeado** en el propio script (no viene de input de usuario ni de red), por lo que tampoco hay riesgo de inyección ahí.

**Conclusión: correcto, sin hallazgos.**

---

## 4. Aislamiento multi-tenant en Server Actions

Elegí 5 acciones de escritura por ID, una por cada módulo pedido:

| Acción | Archivo | Patrón encontrado |
|---|---|---|
| `updateClient` | `src/lib/actions/clients.ts:61-119` | `findFirst({where:{id, empresaId}})` de verificación, y **luego** `update({where:{id}})` sin `empresaId` |
| `deleteClient` | `src/lib/actions/clients.ts:121-150` | Igual patrón: `findFirst` con `empresaId`, luego `update`/`delete` con solo `{id}` |
| `updateProduct` | `src/lib/actions/products.ts:99-206` | Igual: `findFirst({id, empresaId})` en línea 129-131, luego `tx.producto.update({where:{id}})` en línea 154-155 |
| `updateSupplier` | `src/lib/actions/suppliers.ts:69-132` | Igual: `findFirst({id, empresaId})` línea 99-101, luego `update({where:{id}})` línea 106-107 |
| `voidInvoice` | `src/lib/actions/invoices.ts:318-347` | Igual: `findFirst({id, empresaId})` línea 321-323, luego `update({where:{id}})` línea 333-334 |
| (contabilidad) `crearAsientoContable` y familia | `src/lib/contabilidad/asientos.ts` | No es una Server Action expuesta al cliente; recibe `empresaId` como parámetro interno pasado siempre desde acciones que ya lo obtuvieron de `getTenantContext()`. Todas sus consultas (`planCuentas.findMany`, `asientoContable.aggregate/create`) sí incluyen `empresaId` directamente. |

**Hallazgo honesto (severidad baja / observación, no vulnerabilidad explotable hoy):** en los 5 casos de escritura por ID, el patrón real es **"verificar-y-luego-actuar"**: la consulta de verificación (`findFirst`) sí exige `empresaId` de `getTenantContext()`, pero la consulta que **efectivamente modifica o borra el dato** (`update`/`delete`) usa `where: { id }` a secas, **sin repetir `empresaId`**. Esto **no es un IDOR explotable en la práctica** porque:
- Los IDs son `cuid()` no adivinables ni enumerables.
- El paso previo ya deniega el acceso si el registro no pertenece al tenant (`return { message: 'no encontrado o acceso denegado' }` antes de llegar al `update`).

Pero **no es defensa en profundidad**: si en el futuro alguien elimina o comenta por error el bloque de verificación previo (por ejemplo al refactorizar), la mutación quedaría sin ningún filtro de tenant y sí sería explotable. La corrección recomendada (no aplicada, solo se reporta) sería agregar `empresaId` también al `where` del `update`/`delete` final, ej. `where: { id, empresaId }`.

No encontré ningún caso en `src/lib/actions/` ni `src/app/api/` donde `empresaId` se tome directamente de `formData`, `body` o parámetros de URL sin pasar por `getTenantContext()` (búsqueda `empresaId:\s*formData|empresaId\s*=\s*formData|empresaId:\s*body\.` → 0 resultados) — **excepto** el webhook de PayPal, reportado como hallazgo crítico en el punto 5.

---

## 5. Autenticación en rutas de `src/app/api/v1/`

| Endpoint | Requiere auth | Detalle |
|---|---|---|
| `GET /api/v1/audit/invoices/[id]` | ✅ Sí | `getTenantContext()` línea 9 |
| `GET/POST /api/v1/certificates` | ✅ Sí | `getTenantContext()` línea 9 |
| `POST /api/v1/invoices/[id]/authorize` | ✅ Sí | `getTenantContext()` línea 44 |
| `POST /api/v1/invoices/[id]/cancel` | ✅ Sí | `getTenantContext()` línea 9 |
| `GET /api/v1/invoices/[id]` | ✅ Sí | `getTenantContext()` línea 9 |
| `POST /api/v1/invoices/[id]/sign` | ✅ Sí | `getTenantContext()` línea 9 |
| `POST /api/v1/invoices/[id]/validate` | ✅ Sí | `getTenantContext()` línea 9 |
| `GET/POST /api/v1/invoices` | ✅ Sí | `getTenantContext()` línea 17 |
| `GET/POST /api/v1/issuers` | ✅ Sí | `getTenantContext()` línea 9 |
| `GET/POST /api/v1/reconciliation/jobs` | ✅ Sí | `getTenantContext()` línea 9 |
| `POST /api/v1/providers/webhooks/[provider]` | ✅ Sí (patrón correcto) | No usa `getTenantContext()` (no aplica, es un webhook externo), pero exige un **token secreto por empresa** en el header `Authorization: Bearer <webhookToken>`, lo busca en la tabla `Empresa` (`route.ts:13-26`) y usa el `empresaId` encontrado —no uno recibido del payload— para todo lo demás. Patrón correcto. |
| **`POST /api/v1/providers/webhooks/paypal`** | 🔴 **NO** | Ver detalle abajo — vulnerabilidad crítica. |
| `GET/POST /api/v1/seed-demo-suppliers` | ⚠️ Solo sesión, sin rol | Ver detalle abajo — hallazgo medio. |

Nota: todas las rutas marcadas con `getTenantContext()` heredan también, indirectamente, la vulnerabilidad crítica de autenticación descrita arriba (la cookie `session_email` es forjable), pero **en sí mismas sí implementan el control que deberían implementar** (exigir un `empresaId` derivado de sesión antes de tocar datos). El problema de fondo está en `getTenantContext`/`setSessionEmail`, no en estas rutas.

### 🔴 CRÍTICO: `src/app/api/v1/providers/webhooks/paypal/route.ts` no verifica la firma de PayPal

```ts
// líneas 10-16
const transmissionId = request.headers.get('paypal-transmission-id');
const transmissionSig = request.headers.get('paypal-transmission-sig');
if (!transmissionId || !transmissionSig) {
    console.warn('[PayPal Webhook] Missing verification headers');
    return NextResponse.json({ error: 'Missing webhook verification headers' }, { status: 401 });
}
```

Esto solo comprueba que esos dos headers **existan** (que tengan cualquier valor no vacío) — **nunca llama a la API de verificación de firma de PayPal** (`/v1/notifications/verify-webhook-signature`) ni valida criptográficamente que la petición realmente vino de PayPal.

Peor aún, el `empresaId` que se va a modificar se toma directamente del cuerpo de la petición, sin ninguna validación cruzada:
```ts
// línea 27
const empresaId = resource.custom_id || resource.custom;
...
// líneas 93-100
const updatedCompany = await prisma.empresa.update({
    where: { id: empresaId },
    data: { planType, subscriptionStatus, fiscalEnabled: planType !== 'free' }
});
```

**Impacto:** cualquiera puede hacer un `POST` directo a `/api/v1/providers/webhooks/paypal` (con cualquier valor de relleno en los headers `paypal-transmission-id`/`paypal-transmission-sig`, sin que PayPal esté involucrado en absoluto) con un cuerpo como:
```json
{
  "event_type": "BILLING.SUBSCRIPTION.ACTIVATED",
  "resource": { "custom_id": "<empresaId de cualquier empresa>", "plan_id": "<el plan_id 'pro' real>" }
}
```
y el sistema le otorgará plan `pro` y `fiscalEnabled: true` a esa empresa **gratis, sin pago real**. Con `event_type: "BILLING.SUBSCRIPTION.CANCELLED"` un atacante también podría degradar a `free` la suscripción de **cualquier otra empresa** (denegación de servicio sobre el modelo de negocio), ya que el `empresaId` objetivo lo controla completamente quien hace la petición.

### 🟡 MEDIO: `src/app/api/v1/seed-demo-suppliers/route.ts` expuesto sin control de rol, con `GET`

```ts
export async function POST() { return seedHandler(); }
export async function GET() { return seedHandler(); }

async function seedHandler() {
    const { empresaId, userId } = await getTenantContext();
    const countExistentes = await prisma.proveedor.count({ where: { empresaId } });
    if (countExistentes >= 100) { return NextResponse.json({...}); }
    for (let i = 1; i <= 150; i++) {
        // crea proveedor, y con 45% de probabilidad, 1-4 compras + pagos aleatorios
    }
}
```

Este endpoint sí exige sesión (`getTenantContext()`), y sí está correctamente aislado por `empresaId` (no es un problema de fuga entre tenants) — pero:
- Acepta **`GET`**, así que basta con visitar la URL en el navegador estando logueado para dispararlo (no requiere ni un botón de confirmación en la UI).
- No verifica rol (`ctx.role`) — cualquier usuario autenticado de **cualquier plan**, incluyendo `free`, puede ejecutarlo sobre su propia empresa.
- No tiene ninguna protección de entorno (`if (process.env.NODE_ENV !== 'production') return 404` o similar) que impida que una utilidad de "sembrado de datos demo" corra en producción.
- Su efecto es escribir hasta 150 proveedores + compras + pagos **ficticios y aleatorios** directamente en los datos reales de contabilidad de la empresa del usuario, sin ninguna confirmación.

No es una fuga de datos entre empresas, pero si esta ruta llega a producción activa (está bajo `src/app/api/v1/`, no until, sin gate), cualquier cliente real podría contaminar su propia contabilidad con proveedores falsos por accidente (por ejemplo, un bot que rastree URLs, o simple curiosidad tecleando la URL). Dado el contexto de esta conversación (ya encontramos que la demo se sembró por error contra producción), este endpoint es exactamente el tipo de utilidad que debería estar detrás de un rol de administrador o eliminada antes de lanzar a producción real.

---

## 6. Contraseñas y hashing

**Archivo:** `src/lib/actions/profile.ts`

Verificación de la contraseña actual (línea 71):
```ts
const isValid = await compare(currentPassword, user.passwordHash);
```

Generación del nuevo hash antes de guardar (línea 77):
```ts
const newHash = await hash(newPassword, 10);
await prisma.usuario.update({ where: { email }, data: { passwordHash: newHash } });
```

Ambas usan `bcryptjs` (`import { hash, compare } from 'bcryptjs'`, línea 5). **En ningún punto se compara o guarda la contraseña en texto plano.**

Para los usuarios auto-aprovisionados vía Firebase/Google (que no tienen contraseña local), `src/lib/auth/context.ts:61` guarda un valor centinela `passwordHash: 'oauth-firebase'` — no es un hash real, pero tampoco se usa nunca como contraseña válida en ningún flujo de login local: solo sirve para que la columna `passwordHash` (`NOT NULL` en el schema) no quede vacía. No es explotable porque no existe ningún camino de login que compare una contraseña de usuario contra este valor esperando éxito.

**Conclusión: correcto.**

---

## 7. `scripts/enable-rls.ts`

Contenido completo:

```ts
import { prisma } from '../src/lib/db';

async function main() {
    console.log('🔒 Habilitando Row Level Security (RLS) en todas las tablas de Supabase...');

    const tables = [
        'Empresa', 'Sucursal', 'Caja', 'Secuencia', 'Usuario', 'Cliente', 'Producto',
        'Factura', 'FacturaItem', 'Pago', 'Auditoria', 'Cotizacion', 'CotizacionItem',
        'Plan', 'Subscription', 'DocumentUsage', 'PosIntegration', 'PosSyncLog', 'ProductImage'
    ];

    for (const table of tables) {
        try {
            console.log(`Applying RLS to table: ${table}...`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log(`✅ RLS habilitado en "${table}"`);
        } catch (error: unknown) {
            console.error(`❌ Error al habilitar RLS en "${table}":`, error instanceof Error ? error.message : error);
        }
    }
    console.log('🎉 ¡Todas las tablas han sido protegidas exitosamente con RLS!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

**Qué hace:** activa `ROW LEVEL SECURITY` (RLS) de Postgres en 19 tablas específicas (las que existían cuando se escribió el script). Activar RLS sin ninguna política definida hace que, por defecto, **ningún rol sin privilegio de "bypass RLS" pueda leer ni escribir esas tablas** — es una forma de bloquear el acceso directo vía la API REST pública de Supabase (PostgREST), que de otro modo expondría estas tablas a cualquiera con la clave `anon` del proyecto.

**¿Se ejecutó alguna vez?** No encontré ningún comentario, entrada de `PROGRESS.md` o `README.md` que diga explícitamente "se ejecutó este script contra producción en tal fecha" — solo hay un registro de una corrección de lint (`catch (error: any)` → `catch (error: unknown)`, `PROGRESS.md:196`) y una mención de que sirvió de "patrón" para la migración `20260630230000_add_deny_all_policies` (`PROGRESS.md:217`).

Ante la ausencia de evidencia documental, verifiqué directamente el estado real en producción (solo lectura, vía `pg_class.relrowsecurity`) para no asumir nada, y esto reveló algo más importante que la pregunta original:

**Estado real de RLS en producción (verificado 2026-07-04):**

| Grupo de tablas | RLS habilitado | Política "Deny client access" |
|---|---|---|
| Las 19 tablas de `enable-rls.ts` (Empresa, Cliente, Producto, Factura, etc.) | ✅ Sí | ❌ **No existe ninguna** (0 de 28 definidas en la migración `20260630230000_add_deny_all_policies` llegaron a crearse en producción) |
| `AlbaranEstadoHistorial`, `MovimientoInventario` | ✅ Sí | ✅ Sí (vía migración `20260701002555_add_delivery_notes_fields_and_history`) |
| `CuentaBancaria`, `MovimientoBancario` | ✅ Sí | ✅ Sí (vía migración `20260704050915_add_deny_all_policies_bancos`, aplicada hoy en esta misma sesión) |
| **`Proveedor`, `Compra`, `CompraItem`, `PagoProveedor`, `PedidoVenta`, `PedidoVentaItem`, `AlbaranVenta`, `AlbaranVentaItem`, `PlanCuentas`, `AsientoContable`, `AsientoContableLinea`, `PeriodoContable`** | 🟠 **No** | 🟠 **No** |

Esto confirma que `enable-rls.ts` **sí se ejecutó** en algún momento (las 19 tablas originales tienen RLS activo), pero:

1. **La migración `20260630230000_add_deny_all_policies` nunca llegó a aplicarse realmente en producción** — sus 28 sentencias `CREATE POLICY` no existen en la base de datos (`SELECT * FROM pg_policies` solo devuelve 4 filas en total). Funcionalmente esto no cambia el nivel de protección de esas 19 tablas (RLS activo sin política ya deniega todo por defecto, que es el mismo efecto que una política explícita de `USING (false)`), pero si algún día se agrega una política real más permisiva a una de esas tablas asumiendo que ya existe la de "deny all" como base, la situación real de la base de datos no coincidirá con lo que el equipo cree que hay.
2. **Durante la reconciliación de esquema que hice hoy en esta misma sesión, marqué esa migración como "ya aplicada" en `_prisma_migrations` sin verificar su efecto real** (solo comparé columnas y tablas base, no políticas) — esto es un error de mi propio trabajo de hoy que dejo documentado aquí con honestidad: como Prisma ya la considera aplicada, `prisma migrate deploy` nunca la volverá a intentar automáticamente.
3. **12 tablas —incluyendo toda la contabilidad (`PlanCuentas`, `AsientoContable`) y todas las compras a proveedores— no tienen RLS activo en absoluto.** Si este proyecto de Supabase tiene la API pública (PostgREST) habilitada y la clave `anon` llegara a filtrarse alguna vez (hoy no está en ningún `NEXT_PUBLIC_*`, ver punto 1), estas 12 tablas quedarían completamente expuestas a lectura/escritura externa sin pasar por la aplicación Next.js en absoluto.

---

## 8. Dependencias vulnerables (`npm audit`)

Resumen (`npm audit --json`, `metadata.vulnerabilities`):

| Severidad | Cantidad |
|---|---|
| Crítica | 1 |
| Alta | 10 |
| Moderada | 7 |
| Baja | 2 |
| **Total** | **20** |

**Crítica (1):**
- **`protobufjs`** (`<=7.6.2`) — múltiples CVEs: ejecución arbitraria de código, inyección de código vía `toObject` generado, contaminación de prototipos, DoS por recursión no acotada. Fix disponible.

**Altas (10), con el paquete y el resumen del CVE:**
- **`next`** — 22 avisos agrupados bajo este paquete, incluyendo: *"null origin can bypass Server Actions CSRF checks"*, *"HTTP request smuggling in rewrites"*, *"Middleware / Proxy bypass in App Router"* (dos variantes), *"cross-site scripting in App Router applications using CSP nonces"*, y varios de denegación de servicio (Image Optimizer, PPR Resume, Cache Components). Fix disponible sin cambio de versión mayor (`16.2.10`).
- **`@grpc/grpc-js`** (`<=1.9.15`) — un mensaje comprimido malformado puede tumbar el cliente o el servidor.
- **`@prisma/config`** y **`prisma`** (`6.13.0-dev.1 - 6.19.2` / rangos dev) — vulnerabilidad heredada de su dependencia `effect`.
- **`effect`** (`<3.20.0`) — pérdida/contaminación de contexto de `AsyncLocalStorage` bajo carga concurrente con RPC.
- **`defu`** (`<=6.1.4`) — contaminación de prototipos vía clave `__proto__`.
- **`flatted`** (`<=3.4.1`) — DoS por recursión no acotada y contaminación de prototipos en `parse()`.
- **`minimatch`** (varios rangos) — múltiples ReDoS (expresiones regulares con backtracking catastrófico).
- **`picomatch`** (`<=2.3.1` y `4.0.0-4.0.3`) — inyección de método en clases POSIX y ReDoS vía extglobs.
- **`tmp`** (`<0.2.6`) — path traversal vía prefijo/sufijo sin sanitizar, permite escapar del directorio temporal.

Todas tienen `fixAvailable: true` según `npm audit` (no se ejecutó ninguna corrección, solo se reporta, tal como se pidió).

---

## Notas finales

- No se modificó ningún archivo del proyecto durante esta auditoría, salvo la creación de este mismo reporte.
- Las verificaciones de los puntos 2, 7 y el hallazgo del webhook de PayPal requirieron consultas de solo lectura contra la base de datos de producción (Supabase) para no asumir nada sin confirmarlo; no se realizó ninguna escritura y las credenciales pulladas de Vercel se eliminaron del disco inmediatamente después de cada verificación.
- El hallazgo crítico de autenticación (`setSessionEmail`) y el del webhook de PayPal deberían tratarse como prioridad inmediata antes de cualquier lanzamiento real a producción con usuarios y pagos reales.
