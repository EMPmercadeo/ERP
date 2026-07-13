# Limitación de Tasa y Rate Limiting Distribuido - ERP Panamá

Este documento detalla el control y mitigación contra ataques de fuerza bruta y denegación de servicio (DoS).

---

## 1. Middleware y Proveedores
* **Upstash Redis:** Proveedor principal para entornos de producción en la nube. Los límites de tasa se persisten de forma distribuida en Redis.
* **Memoria Local:** pensado para desarrollo y pruebas, **pero también es el fallback real
  en producción** mientras `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` no estén
  configurados (ver `src/lib/redis-ratelimit.ts`). Esto significa que, hoy, cada instancia
  serverless de Vercel lleva su propio contador independiente — el límite real efectivo es
  aproximadamente `límite × número de instancias activas`, no el límite nominal. Cada
  petición degradada emite un `console.warn` visible en los logs de Vercel.
* **`REQUIRE_DISTRIBUTED_RATE_LIMIT=true`:** variable de entorno opcional que, una vez
  Upstash esté configurado y probado, fuerza Fail-Closed (HTTP 429) si Redis falta o no
  responde, en vez de degradar a memoria local. Recomendado activarla antes de vender al
  público — mientras no se active, el rate limiting en producción **no es distribuido**.

---

## 2. Límites de Tasa Aplicados

| Endpoint / Acción | Límite por Minuto | Criterio de Llave | Acción ante Exceso |
| :--- | :---: | :--- | :--- |
| **Login / Autenticación** | 10 peticiones | IP del cliente | HTTP 429 - Bloqueo temporal |
| **Errores de Cliente (`/api/client-errors`)** | 10 peticiones | IP del cliente | HTTP 429 - Descarte de logs |
| **Carga de Archivos** | 5 peticiones | IP + Empresa ID | HTTP 429 - Denegar subida |
| **Facturación y PAC** | 20 peticiones | Empresa ID | HTTP 429 - Reintento con retraso |

---

## 3. Identificación Segura de IP
En entornos cloud, la dirección IP se extrae de cabeceras de proxy confiables del proveedor de hosting (ej. `x-forwarded-for` o `x-real-ip`). Si las cabeceras están ausentes o son ambiguas, el sistema asume una denegación segura.
