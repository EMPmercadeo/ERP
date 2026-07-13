# Monitoreo de Errores y Observabilidad Segura - ERP Panamá

Este documento detalla la política de colección de errores de cliente y logs del lado del servidor.

---

## 1. Centralización de Errores
El endpoint `/api/client-errors` permite recopilar fallos ocurridos en los componentes cliente del navegador. 

### Esquema estricto de validación (Zod):
* **Campos permitidos:** `digest`, `incidentId`, `ruta`, `timestamp`, `versionDespliegue` e IP del informante.
* **Campos estrictamente prohibidos:** `cookies`, `stack traces` crudos de código, `authorization headers`, y datos confidenciales de formularios (ej. contraseñas, saldos o identificadores bancarios).

Si se envían propiedades no autorizadas, la API responde con un `HTTP 400 Bad Request` y descarta el payload completo.

---

## 2. Integración con Sentry (Producción)
* **Verificación de DSN:** Si `SENTRY_DSN` no está configurado, la aplicación omite los reportes de manera segura e introduce una advertencia de inicio.
* **Sanitización de Datos de Envío (PII Scrubbing):** Antes de enviar el reporte a Sentry, los hooks locales eliminan correos, nombres, RUCs o IPs.
