# Auditoría técnica — ERP Panamá (25 de septiembre de 2026)

## Alcance

Revisión transversal del repositorio Next.js/Prisma (378 archivos bajo `src`, 75 páginas y 81 archivos de API) con foco en autorización por empresa y rol, POS, restaurante, caja, reporte Z y diseño móvil. Se revisaron `CLAUDE.md`, `DESIGN.md`, esquema y migraciones Prisma, rutas implicadas y comprobaciones estáticas. No equivale a una certificación fiscal, una prueba de penetración ni una revisión manual línea por línea de todos los módulos.

## Cambios realizados

- Se creó el rol `salonero` y el módulo `/pos/mesas`. El administrador crea mesas y ve el historial; el salonero solo ve y modifica las sesiones que abrió. Cada pedido se guarda en el servidor con precios e impuestos del catálogo. Un índice parcial impide dos sesiones abiertas en la misma mesa.
- El cobro crea la venta POS y cierra la sesión de mesa en una sola transacción, con control de versión. No hay ruta para liberar una mesa abierta sin registrar su venta pagada. El turno del salonero tampoco puede cerrarse mientras tenga mesas abiertas.
- Las mesas normales abiertas más de tres horas generan alerta para administradores; reservas y eventos quedan exentos de ese temporizador. Las alertas quedan en la aplicación y se envían por correo desde un cron cada 15 minutos protegido con `CRON_SECRET`.
- El reporte Z diario ahora tiene registro persistido con usuario y una instantánea del resumen. Solo el administrador puede registrarlo. Exige que no haya turnos ni mesas abiertos de esa jornada; impide nuevas ventas y turnos después del registro y exige el Z anterior antes de iniciar otra jornada con actividad. La hora de cierre es configurable en Panamá, con 22:00 como valor inicial. Un día con actividad y Z pendiente genera alerta al pasar la hora de cierre.
- El administrador puede cerrar un turno que dejó abierto otro cajero desde la pantalla Z, con efectivo contado y rastro de quién hizo el cierre. El servidor impide hacerlo si ese salonero aún tiene mesas abiertas.
- Se ajustaron el encabezado y la altura de paneles del POS para móvil, se hizo accesible el botón de cierre de turno en pantallas pequeñas, y el desglose Z usa dos columnas en móvil. El nuevo módulo de mesas usa una distribución de una columna en móvil y dos en escritorio.
- Se endurecieron las rutas POS: comprobación de roles, pertenencia de mesa, estado/versión, precio/impuesto del catálogo para ventas directas, validación de cola local y límite de paginación. Un recibo sin autorización PAC ya no inventa ni muestra un CUFE.
- Las ventas cobradas pendientes del PAC y las ventas locales ingresadas por primera vez ahora descuentan inventario; la retransmisión de una venta ya guardada no vuelve a descontarlo. Las pendientes quedan visibles en el POS para reintento.
- La anulación POS quedó reservada al administrador. Rechaza ventas de mesa pagada, ventas con cierre Z registrado y ventas ya autorizadas por PAC mientras no exista una operación fiscal real de anulación. Las anulaciones locales permitidas restauran los insumos consumidos por recetas registrados en movimientos de inventario.

## Hallazgos que requieren seguimiento

1. **PAC/DGI:** `src/lib/pac/mock-pac-client.ts` siempre devuelve `success: false`, incluso con el interruptor activado. Las ventas pueden quedar cobradas y registradas pero pendientes de autorización fiscal. Hay que conectar un proveedor PAC real y probarlo con credenciales válidas antes de presentar una factura como autorizada.
2. **Contingencia sin conexión:** el navegador puede mantener ventas locales que el servidor todavía no conoce. Si se registra el Z desde otro dispositivo antes de sincronizarlas, el resumen guardado no las incluirá. El flujo de cola ahora rechaza importes que no coinciden con el catálogo actual, lo que puede exigir revisión manual cuando el precio cambió durante la desconexión. Falta una conciliación formal de ventas tardías y un procedimiento de rectificación del Z.
3. **Inventario concurrente:** la comprobación de existencias precede al descuento de stock; algunas rutas de descuento de inventario capturan errores sin revertir la venta. Varias cajas simultáneas aún podrían sobre vender. Conviene centralizar el descuento en una transacción con actualización condicional.
4. **Horarios nocturnos:** los reportes Z agrupan por día calendario en `America/Panama`. Negocios que cierran después de medianoche necesitan definir si las ventas después de las 00:00 pertenecen a la jornada anterior; el modelo actual las cuenta en la fecha nueva.
5. **Deuda de calidad existente:** ESLint termina sin errores, pero con 70 advertencias. `lint:colors` detecta 117 coincidencias, varias en HTML de correo, PDF y entidades `&#123;` que el detector trata como colores. Se deben revisar reglas y excepciones legítimas antes de usarlo como gate de despliegue.

## Verificación

- `npx prisma validate`: correcto.
- `npx prisma generate`: correcto.
- `npm run typecheck`: correcto.
- `npm run lint`: 0 errores, 70 advertencias.
- `git diff --check`: correcto.
- Comprobaciones puntuales de fechas/horas de Panamá, vencimientos del Z y permisos del rol salonero: correctas.
- Vista móvil de POS y mesas comprobada en navegador a 390 px con respuestas de API simuladas; ambas mantuvieron `scrollWidth = 390 px` y se revisaron capturas. Se corrigió una separación vertical excesiva entre catálogo y carrito en POS.
- `npx next build --webpack`: compilación de producción correcta, sin ejecutar migraciones. Se usó este comando porque `npm run build` aplica migraciones automáticamente a la base configurada.
- No se ejecutó `npm run test:security`: algunos scripts crean y borran registros con la `DATABASE_URL` activa. Requiere una base de pruebas aislada. Tampoco se aplicó la migración ni se hizo una prueba de caja/PAC/correo en producción.

## Despliegue

La migración `20260925120000_restaurant_tables_daily_z` debe aplicarse a la base del entorno de destino antes de activar las rutas nuevas. Confirmar `CRON_SECRET`, SMTP y soporte para el cron de 15 minutos en el plan de hosting. Probar con un negocio de ensayo: dos usuarios saloneros, una mesa normal, una reserva, pago, reporte Z, alerta de tres horas y alerta después de la hora de cierre.
