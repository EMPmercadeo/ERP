# Roadmap de Implementación — ERP Panamá

Este documento es la fuente de verdad de qué falta construir. Cada tarea tiene un criterio de aceptación verificable — no se marca como completa una tarea si no se cumple ese criterio.

## Reglas generales (aplican a TODAS las fases y tareas, sin excepción)

1. Nunca uses `npx prisma db push`. Cualquier cambio de esquema se hace con `npx prisma migrate dev --name [descripcion] --create-only`, revisando el SQL generado, y aplicando con `npx prisma migrate deploy`. Si `migrate dev` falla por entorno no interactivo, usa el patrón de `prisma migrate diff --script` que ya se usó exitosamente antes en este proyecto.
2. No modifiques ningún archivo fuera del alcance explícito de la tarea que estás ejecutando.
3. Después de CADA tarea: ejecuta `npm run build`. Si falla, detente, no continúes a la siguiente tarea, y registra el error completo en `PROGRESS.md`.
4. Si una tarea requiere una decisión de negocio no especificada aquí (qué cuenta contable usar, qué proveedor externo elegir, qué nombre dar a un campo ambiguo), detente y pregunta antes de asumir.
5. Trabaja las tareas EN ORDEN dentro de cada fase. No saltes tareas ni las hagas en paralelo.
6. Si llevas 2 intentos fallidos seguidos en la misma tarea, detente por completo y espera instrucciones — no sigas intentando variantes por tu cuenta.
7. Después de cada tarea completada exitosamente, agrega una entrada a `PROGRESS.md` con este formato exacto:
   ```
   ## [Fecha/hora] Tarea X.X: [nombre]
   Estado: OK | FALLÓ | BLOQUEADO
   Archivos modificados: [lista]
   Resultado de npm run build: [pegar salida relevante]
   Resultado de prueba de verificación: [pegar salida real del script/consulta, no un resumen]
   ```
8. Nunca marques una tarea como "OK" si el build falló o si la prueba de verificación no arrojó evidencia real (no aceptes "funciona correctamente" sin la salida que lo demuestre).
9. No avances a la siguiente FASE (no la siguiente tarea, la siguiente fase completa) sin que el usuario lo confirme explícitamente, incluso si todas las tareas de la fase actual quedaron en OK.

---

## FASE 1d — Reportes contables (continuación inmediata, RIESGO BAJO — solo lectura)

Todas las pantallas de esta fase son de solo consulta (no modifican datos existentes), por eso es la fase piloto para trabajo semi-autónomo.

**Tarea 1d.1 — Libro Diario**
- Objetivo: página `/accounting/journal` que lista todos los AsientoContable de la empresa activa, ordenados por número, con sus líneas expandibles (cuenta, debe, haber, descripción).
- Alcance: 1 página nueva + 1 componente de tabla. No tocar modelos existentes.
- Filtros: por rango de fecha y por origen (FACTURA, COBRO, COMPRA, PAGO_PROVEEDOR, MANUAL).
- Criterio de aceptación: la suma total de "debe" de todos los asientos mostrados es igual a la suma total de "haber". Verificar con una consulta agregada.

**Tarea 1d.2 — Libro Mayor por cuenta**
- Objetivo: página `/accounting/ledger` que, dado un código de cuenta seleccionado de un dropdown (poblado desde PlanCuentas), muestra todos los movimientos de esa cuenta con saldo corriente (running balance).
- Alcance: 1 página nueva. No tocar modelos existentes.
- Criterio de aceptación: el saldo final mostrado para una cuenta coincide con la suma de sus débitos menos créditos (o viceversa según naturaleza) calculada por consulta directa a la base de datos.

**Tarea 1d.3 — Balance de Comprobación**
- Objetivo: página `/accounting/trial-balance` que lista todas las cuentas de PlanCuentas con su saldo deudor o acreedor acumulado a una fecha de corte seleccionable.
- Alcance: 1 página nueva.
- Criterio de aceptación: la suma total de columna "deudor" es igual a la suma total de columna "acreedor".

**Tarea 1d.4 — Estado de Resultados**
- Objetivo: página `/accounting/income-statement` que agrupa cuentas de tipo INGRESO, COSTO y GASTO por un rango de fechas, mostrando utilidad bruta y utilidad neta.
- Alcance: 1 página nueva.
- Criterio de aceptación: Utilidad Neta = Ingresos − Costos − Gastos, verificado contra el cálculo manual de una consulta de prueba.

**Tarea 1d.5 — Balance General**
- Objetivo: página `/accounting/balance-sheet` que muestra Activo, Pasivo y Patrimonio a una fecha de corte.
- Alcance: 1 página nueva.
- Criterio de aceptación: Activo Total = Pasivo Total + Patrimonio Total (la ecuación contable fundamental debe cuadrar). Esta es la prueba más importante de toda la fase — si no cuadra, hay un error en algún asiento generado en fases anteriores y hay que detenerse a investigar, no forzar el cuadre.

**Tarea 1d.6 — Pendiente de fase anterior: facturas de contado**
- Objetivo: cuando una factura se crea con `condicionPago === 'contado'`, debe generarse automáticamente su registro de Pago y el asiento de cobro correspondiente, en la misma transacción de creación de la factura (hoy solo se marca `totalPagado` sin crear el Pago real).
- Alcance: `src/lib/actions/invoices.ts` únicamente, dentro de la transacción ya existente de `createInvoice`.
- Criterio de aceptación: al crear una factura de contado, debe existir un registro en `Pago` y un `AsientoContable` con origen `COBRO` vinculado, además del `AsientoContable` con origen `FACTURA`.

---

## FASE 2 — Bancos y Conciliación (RIESGO MEDIO — nuevo modelo de datos)

**Tarea 2.1** — Modelo `CuentaBancaria` (empresaId, nombre, banco, numeroCuenta, tipoCuenta, saldoContable, cuentaContableId vinculada a PlanCuentas).
**Tarea 2.2** — CRUD de cuentas bancarias en `/settings` o página nueva `/bank-accounts`.
**Tarea 2.3** — Importación de estado de cuenta bancario desde CSV/Excel (usar exceljs, ya está en el proyecto).
**Tarea 2.4** — Pantalla de conciliación manual: emparejar movimientos importados contra AsientoContable existentes, marcar como conciliado.
**Tarea 2.5** — Reporte de flujo de caja proyectado basado en CxC (Factura.saldoPendiente) y CxP (Compra.saldoPendiente).

---

## FASE 3 — Inventario Avanzado (RIESGO ALTO — toca lógica de stock existente)

**Tarea 3.1** — Modelo `Bodega` (empresaId, nombre, sucursalId). Modelo `InventarioBodega` (productoId, bodegaId, cantidad) para reemplazar el campo único `stockActual` en Producto por stock distribuido en bodegas.
**Tarea 3.2** — Migración de datos: mover el `stockActual` actual de cada producto a una "Bodega Principal" por defecto, sin perder cantidades.
**Tarea 3.3** — Transferencias entre bodegas con estado "en tránsito".
**Tarea 3.4** — Lotes con fecha de vencimiento (modelo `LoteProducto`).
**Tarea 3.5** — Campo de código de barras en Producto + búsqueda por código de barras en POS y facturación.
**Tarea 3.6** — Productos compuestos/kits (modelo `ProductoKit` que descuenta stock de sus componentes al venderse).

Nota: esta fase es de riesgo alto porque toca el campo `stockActual` que hoy usan `createPurchase`, `createInvoice` (si descuenta stock) y el módulo de compras. Se recomienda modo supervisado (comando por tarea), no autónomo.

**Actualización 2026-07-06**: la lógica de "crear factura completa" (numeración, asientos contables, descuento de stock con kits/lotes, `incrementDocumentUsage`) vivía duplicada en `createInvoice`/`createInvoicePOS` y estaba ausente/rota en `POST /api/v1/invoices` (la API externa bypaseaba contabilidad y stock por completo). Se consolidó todo en `src/lib/services/invoiceCreation.ts#crearFacturaCompleta()`, usada por los 3 call sites. **Cualquier cambio futuro a la lógica de creación de facturas (Fase 3 en adelante) debe hacerse en ese único archivo, no en `invoices.ts` ni en `route.ts` directamente**, para no reintroducir la divergencia.

---

## FASE 4 — Integraciones Reales (RIESGO MEDIO — requiere credenciales externas del usuario)

**Tarea 4.1** — Email real con Resend o SendGrid, reemplazando el `setTimeout` mock en `sendSupplierEmailAction` (suppliers.ts). Requiere que el usuario cree una cuenta y provea API key.
**Tarea 4.2** — WhatsApp Business API real (o integración con Yappy que el usuario mencionó que tiene API propia) para envío de facturas/recordatorios de cobro. Disparo ya implementado (`src/lib/integrations/whatsapp.ts`) y gateado correctamente (no hace nada sin `whatsappPhone`/`whatsappToken` configurados) — falta que una empresa real registre credenciales y, para mensajes iniciados por el negocio, un template aprobado en Meta Business Manager (hoy usa `type: "text"`, solo válido dentro de la ventana de 24h).
**Tarea 4.3** — Webhooks reales: disparar POST HTTP a la URL configurada en Empresa cuando ocurren eventos (factura creada, pago recibido). Disparo ya implementado (`src/lib/integrations/webhooks.ts`) y gateado correctamente (no hace nada sin `webhookUrl` configurado) — falta que alguna empresa real configure uno para probarse en producción.
**Tarea 4.4** — PayPal con planes reales, reemplazando los IDs mock (`P-MOCK-BASIC-PLAN`) por planes creados de verdad en el dashboard de PayPal.

Nota: todas estas requieren que el usuario obtenga credenciales/cuentas reales antes de poder probarse. No se pueden verificar solo con `npm run build`.

---

## FASE 5 — Integración DGI / PAC (DIFERIDA — pendiente confirmación de contrato con efacturapty)

No iniciar hasta confirmar con efacturapty el modelo de soporte multi-RUC/reseller y tener credenciales de sandbox.

---

## FASE 6 — Opcional / Baja Prioridad

- POS externos reales (Loyverse, Square, WooCommerce, Shopify) — evaluar si de verdad se necesitan antes de invertir tiempo.
- Autenticación biométrica real (WebAuthn con validación de servidor).
- 2FA para usuarios.
- Auditoría extendida (hoy Auditoria solo cubre algunas acciones).

---

## Estado actual (referencia rápida)

✅ Completado y verificado: Fase 0 parcial (limpieza pendiente de confirmar), Fase 1 completa (plan de cuentas + asientos automáticos para Factura, Pago, Compra, PagoProveedor).
🔜 Siguiente: Fase 1d. 
