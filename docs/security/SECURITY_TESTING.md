# Guía de Pruebas de Seguridad y Aislamiento - ERP Panamá

Este documento contiene instrucciones para ejecutar y expandir las pruebas automatizadas de seguridad.

---

## 1. Suites de Pruebas de Seguridad Disponibles
El proyecto cuenta con scripts de smoke-test ejecutables mediante `npx tsx`:
* `scripts/test-isolation.ts` - Pruebas negativas de acceso cruzado (IDOR) entre diferentes inquilinos.
* `scripts/test-roles-negative.ts` - Pruebas de autorización vertical (roles no autorizados intentando ejecutar acciones).
* `scripts/test-sessions.ts` - Verificación del ciclo de vida de cookies y revocación en Firebase Auth.
* `scripts/test-logout.ts` - Pruebas de logout en este dispositivo vs todos los dispositivos.
* `scripts/test-client-errors.ts` - Validación de sanitización y rate limit en el endpoint de errores de cliente.
* `scripts/test-storage.ts` - Pruebas de aislamiento de archivos y fallos seguros de storage en producción.
* `scripts/test-mock-bypass-guard.ts` - Verificación de que no se permite inyectar contextos simulados en producción.

---

## 2. Integración en el Pipeline de CI/CD
Las pruebas deben ejecutarse en cada Pull Request mediante la suite local para asegurar que ningún cambio futuro rompa el aislamiento multiempresa.

```bash
# Ejecutar todas las pruebas de seguridad
npm run test:security
```
