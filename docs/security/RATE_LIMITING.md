# Limitación de Tasa y Rate Limiting Distribuido - ERP Panamá

Este documento detalla el control y mitigación contra ataques de fuerza bruta y denegación de servicio (DoS).

---

## 1. Middleware y Proveedores
* **Upstash Redis:** Proveedor principal para entornos de producción en la nube. Los límites de tasa se persisten de forma distribuida en Redis.
* **Memoria Local:** Utilizado como fallback exclusivo en desarrollo y pruebas para evitar costos innecesarios.

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
