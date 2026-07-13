# Estado y Activación de Integraciones Externas - ERP Panamá
Este documento contiene la especificación, el estado y las instrucciones de activación de las integraciones de terceros en el ERP.

---

## 1. Listado de Integraciones y Estado

| Integración | Tipo | Estado | Dependencia Clave | Adaptador / Código |
| :--- | :--- | :--- | :--- | :--- |
| **Firebase Auth** | Identidad | `CONFIGURED` / `HEALTHY` | `FIREBASE_PRIVATE_KEY` | `src/lib/firebase/admin.ts` |
| **PostgreSQL** | Base de datos | `CONFIGURED` / `HEALTHY` | `DATABASE_URL` | `prisma/schema.prisma` |
| **Vercel Blob** | Almacenamiento | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `BLOB_READ_WRITE_TOKEN` | `src/lib/storage.ts` |
| **AWS S3** | Almacenamiento | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `AWS_SECRET_ACCESS_KEY` | `src/lib/storage.ts` |
| **Upstash Redis** | Rate Limiting | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `UPSTASH_REDIS_REST_TOKEN` | `src/middleware.ts` |
| **Sentry** | Observabilidad | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `SENTRY_DSN` | `src/app/api/client-errors/route.ts` |
| **SMTP Mailer** | Correo SMTP | `CONFIGURED` / `HEALTHY` | `SMTP_PASSWORD` | `src/lib/email/mailer.ts` |
| **PAC / DGI** | Factura Electrónica | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `PAC_CLIENT_SECRET` | `src/lib/integrations/pac.ts` |
| **Yappy** | Pagos Locales | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `YAPPY_SECRET_KEY` | `src/lib/integrations/yappy.ts` |
| **PayPal** | Pagos Globales | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `PAYPAL_CLIENT_SECRET` | `src/lib/integrations/paypal.ts` |
| **WhatsApp API** | Mensajería | `IMPLEMENTADO_PENDIENTE_CREDENCIALES` | `WHATSAPP_ACCESS_TOKEN` | `src/lib/integrations/whatsapp.ts` |

---

## 2. Protocolo de Aislamiento "Fail Closed" sin Credenciales
Cuando una variable secreta falta en el entorno, el adaptador correspondiente lanza un error estructurado en lugar de simular falsos éxitos en silencio.

```json
{
  "code": "INTEGRATION_NOT_CONFIGURED",
  "integration": "YAPPY",
  "message": "La integración de Yappy aún no ha sido configurada en producción."
}
```

---

## 3. Instrucciones de Activación de Servicios

### A. Almacenamiento de Archivos (Vercel Blob / AWS S3)
1. Edite `.env` y cambie `STORAGE_PROVIDER` a `vercel` o `s3`.
2. Para **Vercel Blob**, configure `BLOB_READ_WRITE_TOKEN`.
3. Para **AWS S3**, introduzca `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` y `AWS_S3_BUCKET`.

### B. Upstash Redis (Rate Limiting en Producción)
1. Cree una base de datos Serverless en Upstash.
2. Copie las variables `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN`.
3. El middleware Next.js cambiará automáticamente el proveedor de memoria local a Redis.

### C. Facturación Electrónica (PAC efacturapty)
1. Obtenga credenciales de prueba o producción del PAC autorizado por la DGI.
2. Complete `PAC_CLIENT_ID`, `PAC_CLIENT_SECRET` y configure la URL base.
3. El timbrado automático de facturas tipo "Contado" pasará a procesar autorizaciones reales con la DGI.
