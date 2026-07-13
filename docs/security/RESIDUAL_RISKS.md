# Matriz de Riesgos Residuales - ERP Panamá

Este documento lista y evalúa los riesgos de seguridad remanentes que requieren atención operacional una vez desplegado el sistema.

---

## 1. Integraciones de Terceros Pendientes de Credenciales reales
* **Riesgo:** Alta indisponibilidad si el usuario activa el storage sin credenciales correctas.
* **Mitigación:** La aplicación fallará con un error controlado (`Error: Almacenamiento remoto no configurado...`) en lugar de caerse por completo, deshabilitando únicamente la subida de imágenes de productos. La variable opcional `REQUIRE_REMOTE_STORAGE=true` escala esto a un error de arranque (crítico) una vez que `BLOB_READ_WRITE_TOKEN` esté configurado y probado, para no depender de que cada subida individual falle en runtime.
* **Nivel de Riesgo:** **bajo**.

---

## 2. Latencia en Validación de Firebase Session Cookie
* **Riesgo:** Validar activamente la revocación del token con `checkRevoked = true` requiere que Firebase Admin realice peticiones HTTPS hacia los servidores de Google Firebase, lo cual puede introducir latencias menores en requests.
* **Mitigación:** Vercel / Next.js cachea internamente ciertas peticiones y el middleware protege de accesos masivos inyectados mediante rate limiter de Redis.
* **Nivel de Riesgo:** **bajo**.

---

## 3. Rate Limiting sin Upstash configurado (ACTIVO EN PRODUCCIÓN HOY)
* **Riesgo:** `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` no están configurados en
  producción (ver `REPORTE_VALIDACION_PRODUCCION.md`). El middleware recurre a un contador
  en memoria por instancia serverless — el límite real es más alto que el nominal y no hay
  protección de fuerza bruta verdaderamente distribuida en login, reseteo de contraseña, etc.
* **Mitigación disponible pero NO activada:** se agregó la variable
  `REQUIRE_DISTRIBUTED_RATE_LIMIT`. Con `UPSTASH_REDIS_REST_URL`/`TOKEN` configurados y
  `REQUIRE_DISTRIBUTED_RATE_LIMIT=true`, el sistema bloquea (Fail-Closed) en vez de degradar.
  Hoy esa variable está en `false` por defecto — el checklist por sí solo no bloquea nada,
  es una lista de verificación manual, no un control técnico automático.
* **Nivel de Riesgo:** **medio** hasta que se configure Upstash y se active
  `REQUIRE_DISTRIBUTED_RATE_LIMIT=true`.
