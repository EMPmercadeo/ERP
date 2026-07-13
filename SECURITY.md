# Guía y Políticas de Seguridad - ERP Panamá
Este documento recopila las medidas de hardening de seguridad aplicadas a la plataforma, el modelo de control de acceso implementado y las pautas obligatorias para mantener el sistema libre de vulnerabilidades.

---

## 1. Principios de Seguridad
* **Fail Closed (Denegación por Defecto):** En caso de error, caída de servicios externos (ej. Firebase) o ausencia de parámetros, el sistema detiene inmediatamente la ejecución y niega el acceso.
* **Aislamiento Multi-inquilino (Multi-tenant):** Toda consulta a la base de datos de negocio debe incluir la condición implícita `empresaId`. Nunca se recupera primero un objeto y luego se comprueba la empresa; se consultan ambos criterios simultáneamente.
* **Cero Confianza en el Cliente (Zero-Trust Frontend):** El servidor nunca confía en el `role`, `empresaId` ni importes financieros enviados desde el frontend. La identidad y los permisos se determinan re-autenticando el token de sesión y validando los datos en base de datos.
* **Seguridad en Cookies:** Las cookies de sesión (`session_token`) utilizan los atributos `HttpOnly`, `Secure` (en producción), `SameSite=Lax`, y `Path=/`.
* **Rate Limiting:** Los endpoints críticos (Autenticación, Errores de Cliente, Facturación) están protegidos mediante limitaciones de tasa IP y de token.

---

## 2. Autenticación y Gestión de Sesiones
* **Firebase Admin SDK:** Centraliza la decodificación de las cookies de sesión con `checkRevoked = true` en todo punto de acceso crítico de Next.js (middleware, getTenantContext, etc.).
* **Cierre de Sesión (Logout):**
  * **Local:** Borra las cookies del navegador e introduce un log de auditoría.
  * **Global:** Invoca `adminAuth.revokeRefreshTokens(uid)` invalidando la sesión en todos los dispositivos conectados del usuario, además de borrar las cookies.

---

## 3. Matriz de Roles y Permisos (RBAC)

La aplicación implementa control de acceso basado en roles con validación a nivel de servidor:

| Permiso / Operación | `super_admin` | `admin` | `contador` | `ventas` | `rrhh` |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`users.manage`** (Gestionar usuarios) | Sí | Sí | No | No | No |
| **`settings.manage`** (Ajustes de empresa) | Sí | Sí | No | No | No |
| **`invoices.create`** (Emitir facturas) | Sí | Sí | No | Sí | No |
| **`invoices.cancel`** (Anular facturas) | Sí | Sí | No | No | No |
| **`payments.register`** (Registrar cobros) | Sí | Sí | Sí | Sí | No |
| **`reports.export`** (Ver balances y PDF) | Sí | Sí | Sí | No | No |
| **`rrhh.manage`** (Empleados y nóminas) | Sí | Sí | No | No | Sí |

---

## 4. Prevención de IDOR (Insecure Direct Object Reference)
Todas las mutaciones y lecturas se gatean mediante el helper `getTenantContext()` y las consultas de Prisma se restringen mediante:
```typescript
const item = await prisma.entidad.findFirst({
  where: {
    id: resourceId,
    empresaId: context.empresaId
  }
});
```

---

## 5. Sanitización de Logs e Inyecciones
El endpoint `/api/client-errors` sanitiza los payloads del cliente utilizando esquemas Zod estrictos. Las trazas de stack traces, cookies y cabeceras de HTTP se descartan antes de ser enviadas a los logs del servidor para prevenir el secuestro de sesiones y log injection.
