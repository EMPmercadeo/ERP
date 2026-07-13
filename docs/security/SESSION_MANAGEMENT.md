# Gestión de Sesiones y Autenticación Firebase - ERP Panamá

Este documento detalla el ciclo de vida de la sesión, la seguridad en cookies y los flujos de revocación de credenciales.

---

## 1. Configuración de la Cookie de Sesión
La cookie de sesión se llama `session_token` y se establece de la siguiente manera:
* **httpOnly:** `true` (impide el acceso desde JavaScript en el navegador).
* **secure:** `true` en producción (fuerza la transmisión únicamente por HTTPS).
* **sameSite:** `'lax'` (protección robusta contra ataques CSRF).
* **path:** `'/'` (disponible para todas las rutas del dominio).
* **maxAge:** 7 días (en milisegundos).

---

## 2. Revocación Activa de Tokens (`checkRevoked = true`)
Al descodificar la cookie en el servidor, se forzaría la consulta directa a los servidores de Firebase Auth para revalidar que los tokens de refresco siguen activos.

```typescript
const decoded = await adminAuth.verifySessionCookie(sessionCookie, true /* checkRevoked */);
```

Si el token fue revocado debido a una acción administrativa o cambio de contraseña, el SDK arrojará un error de sesión revocada y el usuario será redirigido inmediatamente a la pantalla de `/login`.

---

## 3. Flujos de Cierre de Sesión (Logout)
* **Cierre Local (Este Dispositivo):** Borra las cookies locales `session_token` y `session_email` sin llamar a la revocación global de Firebase.
* **Cierre Global (Todos los Dispositivos):** Invoca `adminAuth.revokeRefreshTokens(uid)` eliminando la validez del token en cualquier otro navegador o app móvil, y limpia las cookies de forma definitiva.
