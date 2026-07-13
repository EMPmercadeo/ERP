# Checklist de Lanzamiento a Producción - ERP Panamá
Este documento contiene la lista obligatoria de verificaciones y pasos necesarios antes de promover la aplicación a producción.

---

## 1. Verificación del Servidor y Base de Datos (PostgreSQL)
- [ ] **TLS Forzado:** Asegurar que la variable `DATABASE_URL` incluye el parámetro `sslmode=require` para encriptar todas las conexiones a PostgreSQL en tránsito.
- [ ] **Privilegios Mínimos:** Validar que el usuario de base de datos utilizado por Prisma no tiene privilegios de superusuario en la instancia (no usar el usuario `postgres`).
- [ ] **Migraciones Completas:** Confirmar que no hay migraciones pendientes ejecutando `npx prisma migrate status`.
- [ ] **Índices de Multi-inquilinos:** Confirmar que todas las tablas de negocio tienen un índice compuesto por `(id, empresaId)` para optimizar el aislamiento de datos.

---

## 2. Variables de Entorno y Secretos
- [ ] **Desactivar Fallbacks de Desarrollo:** Asegurar que `ALLOW_DEV_FALLBACK` y `FIREBASE_APP_CHECK_ENABLED` estén en `false` en producción.
- [ ] **Comprobación de NEXT_PUBLIC_:** Validar que ninguna variable secreta (ej. `FIREBASE_PRIVATE_KEY` o `PAC_CLIENT_SECRET`) empiece con el prefijo `NEXT_PUBLIC_` para evitar su exposición en el frontend del navegador.
- [ ] **Clave Privada de Firebase:** Validar la carga de la clave multilínea del SDK de administración de Firebase.

---

## 3. Seguridad de Red y Cabeceras
- [ ] **HSTS (HTTP Strict Transport Security):** Habilitada en middleware con `max-age=63072000` y `includeSubDomains`.
- [ ] **Content Security Policy (CSP):** Asegurar que las políticas limitan la carga de scripts e imágenes únicamente a dominios autorizados de Google Firebase, Vercel, y la pasarela de pagos.
- [ ] **MIME Sniffing Prevention:** Cabecera `X-Content-Type-Options: nosniff` activa.

---

## 4. Despliegue en Vercel
- [ ] **Upstash Redis Activado:** Verificar que el rate limit de peticiones API no se ejecuta en la memoria local de la función serverless (Upstash configurado).
- [ ] **Storage Remoto:** Asegurar que `STORAGE_PROVIDER` está en `vercel` o `s3` y no en `local` (el disco efímero de las Serverless Functions borrará las imágenes).
