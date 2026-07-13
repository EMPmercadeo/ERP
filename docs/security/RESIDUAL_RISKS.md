# Matriz de Riesgos Residuales - ERP Panamá

Este documento lista y evalúa los riesgos de seguridad remanentes que requieren atención operacional una vez desplegado el sistema.

---

## 1. Integraciones de Terceros Pendientes de Credenciales reales
* **Riesgo:** Alta indisponibilidad si el usuario activa el storage sin credenciales correctas.
* **Mitigación:** La aplicación fallará con un error controlado `INTEGRATION_NOT_CONFIGURED` en lugar de caerse por completo, deshabilitando únicamente la subida de imágenes de productos.
* **Nivel de Riesgo:** **bajo**.

---

## 2. Latencia en Validación de Firebase Session Cookie
* **Riesgo:** Validar activamente la revocación del token con `checkRevoked = true` requiere que Firebase Admin realice peticiones HTTPS hacia los servidores de Google Firebase, lo cual puede introducir latencias menores en requests.
* **Mitigación:** Vercel / Next.js cachea internamente ciertas peticiones y el middleware protege de accesos masivos inyectados mediante rate limiter de Redis.
* **Nivel de Riesgo:** **bajo**.

---

## 3. Rate Limiting en Entornos Locales sin Upstash
* **Riesgo:** Si no se define `UPSTASH_REDIS_REST_URL` en producción, el middleware recurre a memoria local que no se comparte entre instancias (riesgo de bypass de rate limiting).
* **Mitigación:** El checklist de producción exige la definición obligatoria de Upstash para producción, bloqueando desvíos no autorizados.
* **Nivel de Riesgo:** **bajo**.
