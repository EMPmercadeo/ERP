# Impeccable Backlog — ERP Panamá

Evaluación consolidada de todo el codebase (`src/app`, `src/components`, `public`) generada con `/impeccable audit` + `/impeccable critique` (dashboard, POS, facturas, login, clientes) + revisión liviana (rrhh, superadmin, reportes, bancos, inventario).

**⚠️ Modo degradado: sin navegador/screenshots.** No hay servidor de browser disponible en este entorno (confirmado en corrida previa). Todos los hallazgos vienen de lectura de código fuente + `detect.mjs` (escaneo determinístico de texto), no de inspección visual en vivo ni de medición real de contraste/rendimiento. Tratar los P0/P1 de accesibilidad y contraste como "muy probables" más que "verificados con herramienta".

Método: 1 corrida de `detect.mjs --json src public` (determinístico) + 5 critiques completos con scoring Nielsen (Assessment A vía sub-agente aislado; Assessment B = filtrado del detector determinístico, sin sub-agente de browser) + 1 auditoría técnica de 5 dimensiones + 1 revisión liviana de 5 secciones secundarias.

Fecha: 2026-07-12. No se aplicó ningún fix en el momento de esta redacción. No hay commit de código de producto asociado a este archivo.

**Actualización 2026-07-13/14 — los 4 hallazgos P0 de abajo ya están corregidos en el código** (verificado leyendo los archivos actuales, no solo memoria): `window.alert()` fue reemplazado por los banners inline `avisoCarrito`/`avisoSync`/`avisoEscaneo` en `src/app/pos/page.tsx`; el escaneo de código de barras ahora agrega automáticamente al carrito (`useEffect` de match exacto + `handleCodigoBarrasDetectado`); `src/app/(dashboard)/invoices/[id]/page.tsx` ya usa `<StatusBadge>` de `status-badge.tsx` sin colores hardcodeados; y los errores del PAC se traducen con `humanizePacError()` (`src/lib/facturacion-electronica/pac-errors.ts`) tanto en `billing-fe.ts` como en `DgiActions.tsx`. El resto de los hallazgos (P1 en adelante) no se ha vuelto a verificar y puede seguir vigente.

---

## Cómo leer esto

Cada hallazgo trae: **pantalla/archivo**, **qué está mal**, **por qué importa**, **comando sugerido** (`/impeccable <comando>`).

Los hallazgos en plantillas de PDF/email (`QuotePDF.tsx`, `invoice-template.ts`, `rrhh/expediente/[id]/pdf/route.ts`, `saldoInactivo.ts`, `smtp-test/route.ts`, `soporte/[id]/responder/route.ts`) fueron **excluidos intencionalmente**: usan Arial/Roboto/Courier y colores fuera de DESIGN.md porque son documentos imprimibles/correos, no superficie del sistema de diseño web. Esto es esperado, no un hallazgo.

---

## P0 — Bloqueante

### 1. POS — `alert()` nativo congela la pantalla durante una venta activa
**Archivo:** `src/app/pos/page.tsx:426, 434, 465, 652, 657`
**Qué está mal:** Errores de stock y de sincronización usan `window.alert()` en vez del patrón de banner inline que ya existe en el mismo archivo (`avisoEscaneo`/`errorPago`).
**Por qué importa:** `alert()` congela toda la pestaña, no tiene estilo de marca, y en una tablet táctil es brusco y lento de cerrar a mitad de una transacción — exactamente lo opuesto a "velocidad y prevención de errores" que el POS necesita.
**Comando:** `/impeccable harden`

### 2. POS — El escáner de código de barras no agrega al carrito automáticamente
**Archivo:** `src/app/pos/page.tsx:670-674` (comparar con la implementación correcta ya existente en `src/components/pos/QuickSalePOS.tsx:160-171`, componente que no está en producción)
**Qué está mal:** `productosFiltrados` solo filtra la lista; no hay un efecto que agregue automáticamente el producto al carrito ante un match exacto de código de barras. El comentario en `EscanerCodigoBarras.tsx` afirma que esto "ya funciona" — no es cierto en la página real.
**Por qué importa:** Cada escaneo requiere un tap manual extra, duplicando el esfuerzo en la acción de mayor frecuencia de toda la app — el cajero pierde tiempo en cada venta, todo el día.
**Comando:** `/impeccable optimize`

### 3. Login — El botón de "login biométrico" no verifica nada en el servidor
**Archivo:** `src/app/(auth)/login/page.tsx:78-142` (`handleBiometricLogin`)
**Qué está mal:** Corre una ceremonia WebAuthn del lado del cliente y ante cualquier `credential` truthy (`:99-102`) redirige directo a `/dashboard` — sin verificación de challenge contra un backend, sin llamar a `setSessionToken`.
**Por qué importa:** Para una app cuyo argumento de venta es la seguridad de datos fiscales, un botón de login que aparenta autenticar pero no lo hace es un problema de integridad serio si es alcanzable en producción — puede ser una puerta de entrada no verificada al dashboard.
**Comando:** `/impeccable harden`

### 4. Facturas — La página de detalle ignora el sistema de status compartido
**Archivo:** `src/app/(dashboard)/invoices/[id]/page.tsx:71-101, 247-249, 268-270`
**Qué está mal:** Define helpers locales `getStatusColor`/`getPaymentStatusColor` con colores hardcodeados, incluyendo `animate-pulse` en "pending" — un segundo lenguaje de color y movimiento que contradice el invariante de CLAUDE.md ("`DgiStatus` union type vive en `status-badge.tsx`, no redefinir").
**Por qué importa:** La misma factura muestra colores/formas/animación distintos en el listado vs. el detalle — rompe la confianza justo en la pantalla que más escrutinio recibe de contadores y dueños.
**Comando:** `/impeccable harden`

### 5. Facturas — Errores crudos del PAC se muestran tal cual al usuario final
**Archivo:** `src/lib/actions/billing-fe.ts:84-119`, `src/components/invoices/DgiActions.tsx:186-192`
**Qué está mal:** `mensajeResultado`/`codigoResultado` del PAC se pasan directo a toasts y a la tabla de log, sin traducción a lenguaje plano.
**Por qué importa:** Una factura rechazada bloquea la venta; un dueño de PyME sin experiencia técnica no tiene forma de actuar ante un código crudo del PAC. Esto es exactamente el escenario que el principio "Solidez ante lo fiscal" de PRODUCT.md dice que hay que evitar.
**Comando:** `/impeccable clarify`

### 6. Clientes — El alta rápida de cliente desde cotizaciones está rota
**Archivo:** `src/components/clients/NewClientModal.tsx:46` vs. `src/lib/validations/index.ts:5` (`ClientSchema.tipoRuc: z.string().min(2)`)
**Qué está mal:** El modal por defecto asigna `tipoRuc` como un solo carácter (`'J'`/`'N'`/`'E'`), pero el schema exige mínimo 2 caracteres (`'01'`-`'04'`). Toda submission del modal falla la validación de Zod en el servidor.
**Por qué importa:** Un vendedor armando una cotización para un cliente nuevo no puede darlo de alta sin salir del flujo — falla silenciosamente cada vez que se usa esta vía de alta rápida.
**Comando:** `/impeccable harden`

### 7. Reportes/Contabilidad — Glassmorphism como estilo base en las 5 vistas de estados financieros
**Archivos:** `src/components/accounting/TrialBalanceView.tsx:72,78,84,105,130`, `LedgerView.tsx:95,131,142,151,172`, `JournalList.tsx:124,130,136,157,215,282`, `IncomeStatementView.tsx:84,90,97,109,150`, `BalanceSheetView.tsx:77,83,89,110,135`
**Qué está mal:** Todas usan `bg-white/50 backdrop-blur-md` o `bg-white/80 backdrop-blur-md` como tratamiento base de tarjetas — no es una instancia aislada, es el estilo por defecto de cada card en los 5 estados financieros centrales (diario, mayor, balance de comprobación, estado de resultados, balance general).
**Por qué importa:** CLAUDE.md y DESIGN.md prohíben explícitamente el glassmorphism como decoración ("Don't usar gradientes, glassmorphism..."). Es un costo de rendimiento real (blur repetido en muchas cards por render) sin diferencia visual perceptible (blur blanco sobre fondo blanco), y rompe el dark mode (blanco translúcido sobre fondo oscuro).
**Comando:** `/impeccable harden`

### 8. Inventario — Páginas de producto saturadas de `bg-white` hardcodeado
**Archivos:** `src/app/(dashboard)/products/[id]/page.tsx` (18 ocurrencias, incluyendo header sticky en línea 307, todas las Cards, los 6 `TabsTrigger` activos en líneas 359-374, miniaturas de imagen), `src/app/(dashboard)/products/new/page.tsx` (7 ocurrencias), `src/components/products/ProductList.tsx:604,720`
**Qué está mal:** Todo el shell de detalle/edición/creación de producto (header sticky, tab bar, todas las cards, miniaturas) está construido sobre blanco literal, no sobre un token.
**Por qué importa:** Es el caso más extremo de bypass de tokens encontrado en toda la revisión — en dark mode esta pantalla completa estaría prácticamente rota, y bloquea cualquier futuro cambio de tema.
**Comando:** `/impeccable harden`

---

## P1 — Mayor

### Dashboard
- **Gradiente en el gráfico de tendencia principal.** `src/components/dashboard/TrendChart.tsx:98, 117-123, 179` usa `linear-gradient` en el swatch de leyenda y en el trazo de la línea — DESIGN.md prohíbe gradientes explícitamente, y es el elemento más "plantilla de demo SaaS" del dashboard más visto de la app. → `/impeccable quieter`
- **Cambios de filtro de fecha sin feedback de carga.** `src/components/dashboard/TimeFilter.tsx:97-98,111` dispara `router.push`+`router.refresh()` sin spinner ni skeleton visible; `dashboard/loading.tsx` no cubre este refetch client-side. En un dashboard financiero, una espera silenciosa de varios segundos se lee como app congelada. → `/impeccable polish`

### POS
- **Vaciar carrito y toggle de contingencia sin confirmación.** `src/app/pos/page.tsx:899-907` (vaciar) y `:741-751` (contingencia, estilizado como pill de estado pero es un botón que cambia el comportamiento de emisión fiscal) — un mis-tap en tablet destruye una venta en curso o cambia silenciosamente cómo se factura ante DGI. → `/impeccable harden`
- **Los 7 modales del POS no usan el `Dialog` compartido.** Todos son `div`s `fixed inset-0` hechos a mano en vez de `src/components/ui/dialog.tsx` (Radix, con focus-trap y Esc). Sin escape de teclado garantizado — brecha real de accesibilidad y de consistencia contra el resto de la app. → `/impeccable audit`

### Facturas
- **Regla del Mono rota en la página de detalle.** `src/app/(dashboard)/invoices/[id]/page.tsx:115` (número de factura en `<h1>`), `:162,170` (RUCs) se renderizan en sans de cuerpo, a diferencia de `InvoiceList.tsx:218,239` que sí aplica `font-mono`. Rompe la "Regla del Mono para Datos" de DESIGN.md. → `/impeccable typeset`
- **Sin paso de confirmación antes de timbrar; el aviso de límite de documentos llega tarde.** `InvoiceForm.tsx:725-738` — un solo click ejecuta un timbrado real ante DGI, sin revisión previa; el banner de límite (`:245-281`) solo aparece después de armar toda la factura. → `/impeccable harden`

### Login
- **Dos sistemas de diseño incompatibles en el flujo de auth.** Login y forgot-password usan `<input>` crudos sin `<label>` (`login/page.tsx:314-321,444-451`; `forgot-password/page.tsx:84-91`), mientras que register usa los componentes compartidos `Input`/`Button` con labels (`register/page.tsx:185-213`). Viola el heurístico de Consistencia y es una brecha de accesibilidad. → `/impeccable harden` y después `/impeccable adapt`
- **Pantalla de login sobrecargada de features decorativos.** 4 tarjetas promocionales + botón biométrico + Google (`login/page.tsx:286-424`), varias no funcionales (el "scan QR" solo cierra el modal). Para una tarea de 2 campos, esto es ruido cognitivo que contradice el registro "bóveda corporativa". → `/impeccable distill`

### Clientes
- **Dos paradigmas de alta de cliente que divergen.** Página completa `/clients/new` vs. `NewClientModal` con distinto set de campos (el modal no tiene `limiteCredito`/`diasCredito`/`descuentoEspecial`) y distinto vocabulario de `tipoRuc`. El usuario aprende un modelo mental y choca con otro según por dónde entra. → `/impeccable audit`
- **Importación masiva sin reporte visible de duplicados/errores.** `src/app/(dashboard)/clients/actions.ts:23-26,40` descarta silenciosamente RUCs duplicados y filas sin RUC; `ImportClientsDialog.tsx` nunca renderiza el array `errors` que ya recibe. El parseo CSV con `split(',')` (línea 50) se rompe con direcciones que contienen comas. → `/impeccable harden`

### Auditoría técnica (transversal)
- **Botones de solo-ícono sin nombre accesible.** 54+ ocurrencias de `size="icon"` en 29 archivos sin `aria-label` (ej. `BottomNavigation.tsx:241-246`, acciones de fila en `InvoiceList.tsx`, `ProductList.tsx`). Un usuario de screen reader llega a un "button" sin contexto en cada cierre/editar/eliminar. → `/impeccable harden`
- **Bypass de tokens de diseño a escala: 75 archivos usan colores Tailwind crudos** en vez de los 4 tokens semánticos (`success`/`warning`/`info`/`danger`) o los tokens de marca. Contradice directamente la "Regla del Azul Único" de DESIGN.md, y significa que el `.dark` theme ya construido en `globals.css:201-256` en la práctica no funciona de forma consistente. → `/impeccable audit` (mapeo) → `/impeccable polish`

### RRHH
- **Patrón de borde lateral de acento repetido 12 veces en `PayrollClient.tsx`.** Líneas 312,322,332,342 (`border-l-4`), 390,689 (callouts), 502,547,737,761,844,868 (`border-t-4`, misma familia de anti-patrón). CLAUDE.md prohíbe explícitamente los side-stripe borders; esto no es un caso aislado. → `/impeccable harden`
- **Mismo anti-patrón en el expediente de empleado.** `src/app/(dashboard)/rrhh/empleados/[id]/page.tsx:477` (`border-l-4 border-l-red-500`). → `/impeccable harden`
- **Colores Tailwind crudos en vez de los 4 tokens semánticos.** `PayrollClient.tsx` usa 6+ tonos (cyan/amber/blue/emerald-500) para lo que deberían ser 4 estados; línea 363 tiene `bg-emerald-500 text-black`, una combinación de contraste no revisada. → `/impeccable colorize`

### Superadmin
- **`bg-white` hardcodeado rompe el dark mode.** `src/app/admin/users/page.tsx:95,153,161,177`, `CompanyList.tsx:91`, `CompanyDetailView.tsx:101`. → `/impeccable harden`
- **Sistema de color inconsistente entre páginas del mismo panel.** `CompanyList.tsx`/`CompanyDetailView.tsx`/`CuotasInactivasClient.tsx` usan `text-amber-600`/`text-red-600`/`text-green-600` crudos, mientras `admin/pac` y `admin/support` sí usan `text-success`/`text-danger`/`Badge variant="warning"` correctamente — dos vocabularios de diseño conviviendo en el mismo panel admin. → `/impeccable harden`

### Reportes (dashboard general, no estados financieros)
- **Colores de status crudos, inconsistentes incluso dentro del mismo archivo.** `src/components/reports/ReportsDashboard.tsx` — el donut/línea SVG sí usa `var(--success)/var(--info)/var(--warning)/var(--danger)` (líneas 715-802), pero la leyenda inmediatamente debajo (`:841-845`) y la barra de antigüedad de cuentas por cobrar (`:887-937`) usan 6 tonos Tailwind crudos distintos para los mismos 4 estados. → `/impeccable colorize`
- **`bg-white` hardcodeado en ~20 cards del dashboard de reportes.** `ReportsDashboard.tsx` líneas 480,574,588,602,618,632,646,657,668,686,779,871,960,1016,1074,1111. → `/impeccable harden`

### Bancos
- **Ícono de avatar con gradiente (patrón prohibido).** `src/components/bank-accounts/BankAccountList.tsx:152`, `BankAccountDetailClient.tsx:97` — `bg-gradient-to-br from-brand-1 to-brand-2`. Alcance acotado pero repetido en listado y detalle. → `/impeccable quieter`

---

## P2 — Menor

- **Dashboard — Avatares con gradiente arcoíris decorativo.** `src/components/dashboard/RecentActivityTable.tsx:71-78,145,271` — 6 clases de gradiente cicladas por índice de fila, sin significado semántico; contradice "el color se reserva para estado real". → `/impeccable harden`
- **Dashboard — `border-b-2` de acento en tabs redondeados.** `src/components/dashboard/TimeFilter.tsx:165,168` (confirmado por el escáner determinístico, importado vía `DashboardHeader`) — borde grueso de esquina recta sobre un sistema de esquinas redondeadas. → `/impeccable polish`
- **Facturas — Código ITBMS invisible al armar la factura; sin protección ante refresh.** `InvoiceForm.tsx:401-410,438-443` nunca muestra el código 00/01/02/03 por línea; `items` es un `useState` sin guard de `beforeunload` — un refresh accidental borra la factura en progreso. → `/impeccable distill`
- **Clientes — Avatares con gradiente arcoíris.** `src/components/clients/ClientList.tsx:78-85` — mismo problema que en dashboard, además la paleta se asigna por `row.index`, no por identidad del cliente (cambia de color al reordenar/filtrar). → `/impeccable colorize`
- **Clientes — Colores Tailwind crudos en vez de tokens semánticos.** `ClientDetailClient.tsx:193,196,205,208,430,433` (`amber-500/600`, `emerald-500/700/600`, `red-600`) — no lo detecta `lint:colors` porque apunta a hex, no a clases utilitarias. → `/impeccable distill`
- **Login — Código de error crudo de Firebase expuesto.** `login/page.tsx:71` (`Error al conectar con Google (${error.code})`) rompe el patrón de error humanizado usado dos líneas antes para email/password. → `/impeccable clarify`
- **Técnico — Cero uso de `next/image` en toda la app.** 10+ `<img>` crudos, incluyendo grillas de producto en POS (`QuickSalePOS.tsx:370,439,563`) y galería de producto (`products/[id]/page.tsx`). Sin lazy-loading ni `srcset` automático en superficies que un cajero ve todo el día. → `/impeccable optimize`
- **Técnico — Componentes `'use client'` de más de 2000 líneas.** `SettingsClient.tsx` (2179 líneas), `pos/page.tsx` (1616 líneas), `PayrollClient.tsx` (892), `InvoiceList.tsx` (809), `InvoiceForm.tsx` (739) — bundles de JS infladas, nada se puede server-renderizar. → `/impeccable optimize`
- **Técnico — Touch targets menores a 44px en el drawer móvil.** `BottomNavigation.tsx:241-246` — botón de cerrar con área táctil ≈32px. → `/impeccable adapt`
- **`globals.css:320` — radio de 3px fuera de la escala de DESIGN.md.** → `/impeccable polish`

---

## P3 — Pulido

- **Dashboard:** código duplicado byte-a-byte entre `Sparkline` (`KpiCard.tsx:22-37`) y `smooth` (`TrendChart.tsx:17-32`); `console.log` de debug dejado en producción (`TimeFilter.tsx:96,109`); `ITEMS_PER_PAGE = 5` en actividad reciente obliga a 4 páginas de clicks; tarjetas de acción rápida usan `emerald-500`/`purple-500` ad hoc en vez de tokens (`dashboard/page.tsx:376-416`); sin validación de rango de fecha custom (`end < start` posible, `TimeFilter.tsx:196-230`). → `/impeccable harden` / `/impeccable audit`
- **Facturas:** `InvoiceList.tsx:483` hardcodea `border-red-200`/`text-red-700`; `ImportInvoicesDialog.tsx:87,91,96` usa `alert()` nativo en vez del patrón de toast (`sonner`) del resto de la app; modal de bloqueo de documentos usa `indigo-600/50` fuera de marca (`InvoiceForm.tsx:661-667,673`); `badge.tsx:21-26` tiene variantes hardcodeadas muertas (siempre sobreescritas por `statusClassMap`). → `/impeccable polish`
- **Login:** copy/color de loading inconsistente entre breakpoints móvil/desktop para la misma acción; falta `autoComplete="email"/"current-password"` en los inputs; se muestra "Versión 1.0.0" a usuarios finales; nombres como "Verificador QR DGI"/"Permiso Biométrico DGI" insinúan afiliación oficial con DGI que el producto no tiene. → `/impeccable clarify`
- **Clientes:** flash de blanco al montar (`ClientList.tsx:376-378` renderiza `null` hasta `isMounted` en vez de usar el skeleton existente); `confirm()` nativo del browser para borrar en vez del `Dialog` propio (`ClientList.tsx:149`); parseo frágil de `diasCredito` vía regex sobre `condicionPago` (`EditClientForm.tsx:52-57`); algoritmo de iniciales de avatar distinto entre listado y detalle. → `/impeccable polish`
- **Técnico:** salto de jerarquía de encabezados h1→h3 en el dashboard (`dashboard/page.tsx:384,397,410`, sin `<h2>` intermedio) → `/impeccable typeset`; `global-error.tsx` usa hex inline en vez de variables CSS — parcialmente justificado porque este archivo puede renderizar cuando la app misma está rota, pero vale alinear la paleta a los tokens de `danger`. → `/impeccable polish`
- **Bancos:** `BankAccountList.tsx:128` hardcodea `bg-white` en el input de búsqueda (instancia aislada, bajo impacto).
- **Inventario:** `ProductList.tsx:822` y `CategoriesManagerModal.tsx:134` usan `backdrop-blur-sm` decorativo sobre fondos ya blancos; `products/expiring/page.tsx:74` tiene un override redundante `text-foreground dark:text-white`.

---

## Patrones sistémicos (no son bugs puntuales, son hábitos a corregir de raíz)

1. **Bypass de tokens de diseño a gran escala.** 75 archivos usan colores Tailwind literales (`emerald-500`, `amber-600`, `rose-50`, etc.) en vez de los 4 tokens semánticos o los tokens de marca. Aparece en dashboard, POS, facturas, clientes, rrhh, superadmin, reportes y, de forma extrema, en inventario. El `.dark` theme ya está construido en `globals.css` pero en la práctica no es confiable mientras esto no se resuelva. Este es el hallazgo de mayor apalancamiento de todo el backlog — arreglar esto resuelve directamente varios P0/P1/P2 de una sola vez.
2. **`border-l-4`/`border-t-4` (side-stripe) como decoración recurrente**, no solo en un archivo: `rrhh/empleados/[id]/page.tsx`, `PayrollClient.tsx` (12 instancias), confirmado también por el escáner determinístico.
3. **Gradientes decorativos** en avatares (dashboard, clientes, bancos) pese a que DESIGN.md los prohíbe explícitamente y de forma nombrada ("La Regla del Azul Único").
4. **Accesibilidad de botones de solo-ícono**: 54+ instancias sin `aria-label` en 29 archivos — patrón transversal, no aislado a una pantalla.
5. **Dos sistemas de validación/UI conviviendo para la misma acción** (alta de cliente: modal vs. página completa; auth: inputs crudos vs. componentes compartidos) — indicio de que ciertas features se construyeron en sesiones distintas sin reconciliar.

## Hallazgos positivos (mantener y replicar)

- `src/components/ui/status-badge.tsx` es una implementación modelo: cada estado combina ícono + texto + color de token, nunca solo color — exactamente lo que un ERP fiscal necesita para que un usuario daltónico no malinterprete un estado DGI.
- `src/components/ui/table.tsx` envuelve toda tabla en `overflow-x-auto` por defecto — seguridad de scroll horizontal gratis en toda la app.
- Los estados de foco (`focus-visible`) están correctamente implementados a nivel de primitiva (`button`, `input`, `select`, `textarea`, `tabs`, `radio-group`, `badge`) — el hueco de accesibilidad es específicamente en botones custom de solo-ícono, no en la librería base.
- `admin/pac/page.tsx` y `admin/support/page.tsx` son las implementaciones más limpias de todo el review — buena referencia para nivelar el resto del panel admin.
- El flujo de venta del POS tiene decisiones de UX genuinamente sólidas: turno-gate obligatorio antes de vender, botones de efectivo rápido con cálculo de vuelto en vivo, y bloqueo de descuentos por PIN de admin — diseño real de caja registradora, no un CRUD genérico.
- El detalle de cliente (`ClientDetailClient.tsx`) incluye un estado de cuenta con saldo corriente cronológico y links a facturas origen — funcionalidad de nivel contable, no un CRUD superficial.

---

## Ranking de pantallas

**Mejor:** Bancos (badges semánticos consistentes, buenas bases de accesibilidad, sin violaciones de accent-border/glassmorphism — solo un gradiente de avatar repetido pero acotado) y `admin/pac`/`admin/support` dentro de superadmin.

**Peor:** Reportes/Contabilidad (glassmorphism como estilo base en las 5 vistas de estados financieros — P0, es una violación explícitamente nombrada en el brief de diseño — más un dashboard de reportes donde casi cada card ignora el token de tema) e Inventario (páginas de producto con el caso más extremo de `bg-white` hardcodeado de todo el review, dark mode roto por completo en esas pantallas).

## Resumen por comando sugerido (para priorizar la ejecución)

1. `/impeccable harden` — el más recurrente por lejos: cubre casi todos los P0 y buena parte de los P1 (validación rota, errores crudos, accesibilidad, tokens/dark-mode).
2. `/impeccable audit` (scoped) — mapeo de los 75 archivos con colores crudos a tokens; migración de modales POS a `Dialog`.
3. `/impeccable colorize` / `/impeccable quieter` — limpieza de gradientes y colores de estado inconsistentes.
4. `/impeccable clarify` — mensajes de error DGI/PAC y Firebase en lenguaje plano.
5. `/impeccable typeset`, `/impeccable distill`, `/impeccable optimize`, `/impeccable adapt`, `/impeccable polish` — el resto de P2/P3.
6. Cerrar con `/impeccable polish` como pase final una vez resueltos los P0/P1.
