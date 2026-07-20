# Recordatorio de saldo de facturas inactivo

Implementado el 2026-07-11. Detecta clientes con **saldo de facturas electrónicas prepago sin usar por 3+ meses**, les avisa por correo (y te manda un resumen a ti), y te deja darles de baja el saldo **manualmente**. El saldo **nunca** se elimina de forma automática.

## Cómo funciona

- **Detección** (`src/lib/services/saldoInactivo.ts` → `getCuentasSaldoInactivo`): cuentas `ACTIVA`, no borradas, con `saldoFacturas > 0` y sin ningún `MovimientoCuota` tipo `DEBITO_EMISION` en los últimos 3 meses (si nunca consumieron, se mide desde la creación de la cuenta). Una sola consulta agregada (`groupBy`), sin N+1.
- **Notificación** (`notificarCuentasSaldoInactivo`): un correo a cada cliente (`Cuenta.correo`) y un correo-resumen a los superadmin. Reutiliza `enviarCorreoSuperadmin` (SMTP de BD o env, y registro en `CorreoEnviado`). **Anti-spam:** no se le vuelve a escribir al mismo cliente dentro de 30 días (campo nuevo `Cuenta.notificadoInactividadEn`).
- **Baja manual del saldo** (solo superadmin): acción `eliminar_saldo` en `POST /api/admin/cuotas/[cuentaId]`. Deja el saldo en 0 registrando un `MovimientoCuota` tipo `AJUSTE_MANUAL` (el ledger sigue cuadrando) y un log de auditoría `ELIMINAR_SALDO_INACTIVO`. Requiere nota obligatoria. Nunca es automática.

## Dónde lo ves

- **Panel:** `/admin/cuotas-inactivas` (enlazado desde el dashboard admin, botón "Saldo Inactivo"). Tabla con saldo, días sin usar, último uso, si ya se notificó, botón **"Notificar a todos"** y **"Eliminar saldo"** por fila.
- **Tu correo:** resumen a todos los usuarios `super_admin` activos + `SUPERADMIN_EMAIL` (si la defines).

## Archivos

**Nuevos**
- `src/lib/services/saldoInactivo.ts` — detección + notificación.
- `src/app/api/admin/cuotas/inactivas/route.ts` — `GET` (listar) y `POST` (notificar), solo superadmin (POST también acepta cron con bearer).
- `src/app/api/cron/saldo-inactivo/route.ts` — cron `GET` protegido con `CRON_SECRET` para Vercel Cron.
- `src/app/admin/cuotas-inactivas/page.tsx` + `CuotasInactivasClient.tsx` — panel.
- `vercel.json` — cron diario a las 13:00 UTC (~8:00 a.m. Panamá).
- `prisma/migrations/20260711120000_add_cuenta_notificado_inactividad/migration.sql`.

**Modificados**
- `prisma/schema.prisma` — campo `Cuenta.notificadoInactividadEn DateTime?`.
- `src/app/api/admin/cuotas/[cuentaId]/route.ts` — acción `eliminar_saldo`.
- `src/app/admin/page.tsx` — botón al nuevo panel.

## Qué debes configurar (variables de entorno en Vercel)

| Variable | Para qué | Obligatoria |
|---|---|---|
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL` | Enviar los correos (o configúralo en `ConfiguracionSMTP` en la BD) | Sí, para que salgan correos |
| `SUPERADMIN_EMAIL` | Correo extra donde recibir el resumen (además de los usuarios super_admin) | Opcional |
| `CRON_SECRET` | Habilita el cron automático de Vercel. Sin esto, el cron responde 503 y solo funciona el botón manual | Opcional (recomendada) |

> El cron diario + la ventana anti-spam de 30 días implican que a cada cliente inactivo se le avisa como mucho una vez al mes, aunque el cron corra a diario.

## Pasos para activarlo (en tu Windows)

```powershell
cd C:\Users\ermom\.gemini\antigravity\scratch\erp-panama
npx prisma generate      # toma el nuevo campo notificadoInactividadEn
npx prisma migrate deploy   # aplica la migración (o corre npm run build, que ya lo hace)
npm run build            # confirma tipos + compilación
```

Luego define `CRON_SECRET` (y el SMTP si aún no) en Vercel y haz deploy.

## Nota de verificación

Las correcciones y este feature se escribieron y verificaron por inspección sobre el host. **No pude correr `prisma generate` ni el build en el entorno de auditoría** (es Linux y el `node_modules` del proyecto es de Windows; además la sesión paralela de Gemini/Antigravity dejó el working tree a medio sincronizar durante la sesión). Corre `npm run build` en tu máquina para la confirmación final de tipos.
