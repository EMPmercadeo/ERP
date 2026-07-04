# Estado Actual de la Aplicación: ERP Panamá

Este documento presenta un inventario completo, exhaustivo y honesto del estado actual de la plataforma de facturación electrónica y gestión ERP Panamá.

---

## 1. STACK

### Arquitectura y Frameworks
* **Framework Principal:** [Next.js](https://nextjs.org/) v16.1.1 (usando App Router y Server Actions).
* **Librería de Renderizado:** [React](https://react.dev/) v19.2.3.
* **Procesamiento de Estilos:** [Tailwind CSS](https://tailwindcss.com/) v4.0.0 (junto a `@tailwindcss/postcss`).

### Base de Datos y ORM
* **Base de Datos:** PostgreSQL (base de datos relacional multi-inquilino).
* **ORM (Object-Relational Mapping):** [Prisma Client](https://www.prisma.io/) v6.0.0.

### Librerías de Producción Principales
* **Autenticación (Cliente):** `firebase` v12.7.0 (integrado con Firebase Auth).
* **Manejo de Estado Global:** `zustand` v5.0.9 (definido en [store.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/store.ts)).
* **Gestión de Tablas Interactivas:** `@tanstack/react-table` v8.21.3.
* **Validación de Datos y Esquemas:** `zod` v4.3.5.
* **Manipulación de Fechas:** `date-fns` v4.1.0.
* **Generación de Documentos PDF:** `@react-pdf/renderer` v4.3.2.
* **Exportación de Datos (Excel):** `exceljs` v4.4.0 y `file-saver` v2.0.5.
* **Kit de Iconos:** `lucide-react` v0.562.0.
* **Seguridad y Tokens (Servidor):** `bcryptjs` v3.0.3 y `jsonwebtoken` v9.0.3.
* **Controladores en package.json (no usados en src):** `puppeteer` v25.2.1.

### Árbol Resumido de Carpetas
```
erp-panama/
├── docker/                 # Configuración de Docker local y plantillas env
├── prisma/                 # Esquema Prisma (schema.prisma) y script de seed
├── public/                 # Recursos estáticos de la aplicación
├── scripts/                # Scripts auxiliares de desarrollo e inicialización
├── src/                    # Carpeta raíz del código fuente
│   ├── app/                # Enrutamiento App Router y Endpoints del API
│   │   ├── (auth)/         # Login, registro y restablecimiento de contraseña
│   │   ├── (dashboard)/    # Módulos del ERP (Facturas, Clientes, Reportes, etc.)
│   │   ├── admin/          # Panel de administración global (Super Admin)
│   │   ├── api/            # Endpoints locales de búsqueda y lógica de negocio
│   │   └── api/v1/         # API pública y de integraciones (DGI/Paypal/Webhooks)
│   ├── components/         # Componentes UI reutilizables agrupados por módulo
│   └── lib/                # Configuración de base de datos, auth, schemas y actions
├── package.json            # Manifiesto de dependencias de Node.js
└── tsconfig.json           # Configuración de TypeScript
```

---

## 2. MODELO DE DATOS

Todos los modelos y relaciones están definidos en [schema.prisma](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/prisma/schema.prisma). A continuación se detalla el inventario de entidades:

| Tabla / Modelo | Campo de Empresa (Tenant) | Campos Principales y Tipos | Relaciones Clave |
| :--- | :---: | :--- | :--- |
| **`Empresa`** | *Es el Tenant* | `id` (String PK), `ruc` (String Unique), `dv` (String), `razonSocial` (String), `planType` (String), `fiscalEnabled` (Boolean), `ambienteDgi` (String), `certificadoDgi` (String?), `usuarioPac`/`passwordPac` (String?) | Relaciona con sucursales, cajas, usuarios, clientes, productos, facturas, compras y planes. |
| **`Sucursal`** | **Sí** (`empresaId`) | `id` (String PK), `codigo` (String), `nombre` (String), `direccion` (String), `activa` (Boolean) | Pertenece a `Empresa`. Relaciona con cajas, facturas y pedidos. |
| **`Caja`** | **Sí** (`empresaId`) | `id` (String PK), `sucursalId` (String), `codigo` (String), `nombre` (String), `activa` (Boolean) | Pertenece a `Empresa` y `Sucursal`. Relaciona con facturas, pedidos y albaranes. |
| **`Secuencia`** | **Sí** (`empresaId`) | `id` (String PK), `sucursalId` (String), `cajaId` (String), `tipoDocumento` (String), `ultimoNumero` (Int) | Controla el número de folios de forma atómica por caja. |
| **`Usuario`** | **Sí** (`empresaId`) | `id` (String PK), `email` (String Unique), `nombre` (String), `rol` (String: vendedor/admin/super_admin), `activo` (Boolean), `passwordHash` (String) | Crea facturas, pagos, compras, pedidos y albaranes. |
| **`Cliente`** | **Sí** (`empresaId`) | `id` (String PK), `ruc` (String), `dv` (String?), `razonSocial` (String), `limiteCredito` (Decimal), `saldoPendiente` (Decimal), `saldoAFavor` (Decimal), `condicionPago` (String) | Relaciona con cotizaciones, facturas, pagos y pedidos. |
| **`Producto`** | **Sí** (`empresaId`) | `id` (String PK), `codigoInterno` (String), `descripcion` (String), `precioVenta` (Decimal), `costoUnitario` (Decimal), `codigoTasaItbms` (String), `stockActual` (Int) | Aparece en ítems de facturas, cotizaciones, compras, pedidos y albaranes. |
| **`Factura`** | **Sí** (`empresaId`) | `id` (String PK), `clienteId` (String), `tipoDocumento` (String: FE/REC), `numeroCompleto` (String Unique), `subtotal` (Decimal), `totalItbms` (Decimal), `totalNeto` (Decimal), `saldoPendiente` (Decimal), `estadoDgi` (String) | Contiene `FacturaItem`s, `Pago`s y pertenece a un `Cliente`. |
| **`FacturaItem`** | No (vía `Factura`) | `id` (String PK), `facturaId` (String), `productoId` (String), `cantidad` (Decimal), `precioUnitario` (Decimal), `montoItbms` (Decimal), `montoTotal` (Decimal) | Vincula un producto vendido a una factura. |
| **`Pago`** | **Sí** (`empresaId`) | `id` (String PK), `facturaId` (String), `clienteId` (String), `usuarioId` (String), `monto` (Decimal), `metodoPago` (String) | Registra cobros aplicados a una factura del cliente. |
| **`Auditoria`** | No (vía `Usuario`) | `id` (String PK), `usuarioId` (String), `entidad` (String), `accion` (String), `datosAntes` (Json?), `datosDespues` (Json?) | Guarda registros de cambios y tickets de soporte. |
| **`Cotizacion`** | **Sí** (`empresaId`) | `id` (String PK), `clienteId` (String), `numero` (String Unique), `validaHasta` (DateTime), `totalNeto` (Decimal), `estado` (String) | Contiene `CotizacionItem`s. Se puede convertir a pedido o factura. |
| **`CotizacionItem`** | No (vía `Cotizacion`) | `id` (String PK), `cotizacionId` (String), `productoId` (String), `cantidad` (Decimal), `precioUnitario` (Decimal), `montoTotal` (Decimal) | Detalle de los productos cotizados. |
| **`Plan`** | **No** (Global) | `id` (String PK), `name` (String), `slug` (String Unique), `includedDocuments` (Int), `maxUsers` (Int), `priceMonthly` (Decimal) | Define los límites del plan para suscripciones. |
| **`Subscription`** | **Sí** (`empresaId`) | `id` (String PK), `planId` (String), `status` (String), `currentPeriodEnd` (DateTime), `paymentProvider` (String) | Asocia una empresa con un plan de cobro activo. |
| **`DocumentUsage`** | **Sí** (`empresaId`) | `id` (String PK), `month` (Int), `year` (Int), `includedLimit` (Int), `usedDocuments` (Int), `remainingDocuments` (Int) | Controla el consumo mensual de folios del inquilino. |
| **`PosIntegration`** | **Sí** (`empresaId`) | `id` (String PK), `providerSlug` (String), `status` (String), `syncProductsEnabled` (Boolean), `lastSyncAt` (DateTime?) | Configuración de integraciones POS (Loyverse, Square, etc.). |
| **`PosSyncLog`** | **Sí** (`empresaId`) | `id` (String PK), `posIntegrationId` (String), `syncType` (String), `status` (String), `recordsProcessed` (Int) | Bitácora de ejecuciones de sincronización POS. |
| **`ProductImage`** | **Sí** (`empresaId`) | `id` (String PK), `productoId` (String), `imageUrl` (String), `isPrimary` (Boolean), `sortOrder` (Int) | Manejo de imágenes de productos. |
| **`Proveedor`** | **Sí** (`empresaId`) | `id` (String PK), `ruc` (String), `razonSocial` (String), `saldoPendiente` (Decimal), `condicionPago` (String) | Relaciona con compras y pagos a proveedores. |
| **`Compra`** | **Sí** (`empresaId`) | `id` (String PK), `proveedorId` (String), `numeroFactura` (String), `subtotal` (Decimal), `totalNeto` (Decimal), `saldoPendiente` (Decimal), `estadoPago` (String) | Registra la entrada de mercancías y deudas. |
| **`CompraItem`** | No (vía `Compra`) | `id` (String PK), `compraId` (String), `productoId` (String?), `descripcion` (String), `cantidad` (Decimal), `montoTotal` (Decimal) | Detalle de artículos en una factura de compra. |
| **`PagoProveedor`** | **Sí** (`empresaId`) | `id` (String PK), `compraId` (String), `proveedorId` (String), `monto` (Decimal), `metodoPago` (String) | Registra egresos para pagar cuentas de proveedores. |
| **`PedidoVenta`** | **Sí** (`empresaId`) | `id` (String PK), `clienteId` (String), `numero` (String Unique), `estado` (String: pendiente/entregado/anulado), `totalNeto` (Decimal) | Pedidos pendientes de entrega. |
| **`PedidoVentaItem`** | No (vía `PedidoVenta`) | `id` (String PK), `pedidoId` (String), `productoId` (String), `cantidad` (Decimal), `montoTotal` (Decimal) | Ítems individuales de un pedido de venta. |
| **`AlbaranVenta`** | **Sí** (`empresaId`) | `id` (String PK), `clienteId` (String), `numero` (String Unique), `estado` (String), `totalNeto` (Decimal), `firmaClienteUrl` (String?) | Nota de entrega firmada que descarga inventario. |
| **`AlbaranVentaItem`** | No (vía `AlbaranVenta`) | `id` (String PK), `albaranId` (String), `productoId` (String), `cantidad` (Decimal), `montoTotal` (Decimal) | Ítems de despacho incluidos en el albarán. |
| **`AlbaranEstadoHistorial`** | **Sí** (`empresaId`) | `id` (String PK), `albaranId` (String), `estadoAnterior` (String), `estadoNuevo` (String), `usuarioId` (String) | Historial de auditoría para cambios de estado en entregas. |
| **`MovimientoInventario`** | **Sí** (`empresaId`) | `id` (String PK), `productoId` (String), `tipo` (String: entrada/salida), `cantidad` (Int), `concepto` (String: compra/venta/ajuste) | Kárdex detallado de inventario. |

---

## 3. PANTALLAS (Vistas y Rutas)

### Rutas Públicas y de Autenticación (`(auth)`)
* `/` `(src/app/page.tsx)` Redirecciona automáticamente a `/dashboard` o `/login` evaluando la sesión activa.
* `/login` `(src/app/(auth)/login/page.tsx)` Acceso al portal. Soporta autenticación por correo, federada por Google y botón para flujo biométrico.
* `/register` `(src/app/(auth)/register/page.tsx)` Registro de nuevos usuarios y creación inicial de sus empresas en base de datos.
* `/forgot-password` `(src/app/(auth)/forgot-password/page.tsx)` Formulario para recuperar contraseña enviando correos mediante Firebase.

### Rutas Privadas del ERP (`(dashboard)`)
* `/dashboard` `(src/app/(dashboard)/dashboard/page.tsx)` Panel principal. Muestra indicadores financieros, gráficos de tendencias de venta y cobros, y estado de conexión con DGI.
* `/invoices` `(src/app/(dashboard)/invoices/page.tsx)` Historial de facturas y recibos emitidos con filtros por estado de pago y estado fiscal ante DGI.
* `/invoices/new` `(src/app/(dashboard)/invoices/new/page.tsx)` Formulario interactivo para emitir una nueva factura local o fiscal seleccionando clientes y productos de catálogo.
* `/invoices/[id]` `(src/app/(dashboard)/invoices/[id]/page.tsx)` Detalle de factura. Ofrece botones para descargar PDF, registrar cobros, firmar, enviar a la DGI y anular (emisión de nota de crédito).
* `/clients` `(src/app/(dashboard)/clients/page.tsx)` Directorio y buscador de clientes registrados en el tenant.
* `/clients/new` `(src/app/(dashboard)/clients/new/page.tsx)` Formulario para ingresar nuevos clientes especificando RUC, DV, dirección y límite de crédito.
* `/clients/[id]` `(src/app/(dashboard)/clients/[id]/page.tsx)` Perfil completo del cliente. Historial de compras, bitácora de cobros recibidos y estado de su saldo deudor.
* `/clients/[id]/edit` `(src/app/(dashboard)/clients/[id]/edit/page.tsx)` Edición de campos del perfil de un cliente.
* `/products` `(src/app/(dashboard)/products/page.tsx)` Lista de catálogo de productos y servicios con stock actual y controles para exportar a Excel.
* `/products/new` `(src/app/(dashboard)/products/new/page.tsx)` Formulario para crear un nuevo producto indicando código interno, tasa ITBMS y stock mínimo.
* `/products/[id]` `(src/app/(dashboard)/products/[id]/page.tsx)` Ficha del producto. Permite gestionar imágenes de galería y consultar el Kárdex de movimientos de inventario.
* `/quotes` `(src/app/(dashboard)/quotes/page.tsx)` Historial de cotizaciones y proformas emitidas a clientes.
* `/quotes/new` `(src/app/(dashboard)/quotes/new/page.tsx)` Formulario para estructurar cotizaciones con ítems libres (descripción y costo libre) o catálogo.
* `/quotes/[id]` `(src/app/(dashboard)/quotes/[id]/page.tsx)` Detalle de cotización. Permite descargar PDF o procesarla directamente para crear un pedido de venta.
* `/orders` `(src/app/(dashboard)/orders/page.tsx)` Visualización de pedidos de venta y seguimiento del estado de preparación de mercancía.
* `/delivery-notes` `(src/app/(dashboard)/delivery-notes/page.tsx)` Control de albaranes y notas de entrega pendientes de facturar.
* `/delivery-notes/new` `(src/app/(dashboard)/delivery-notes/new/page.tsx)` Formulario para emitir un albarán y registrar datos de transporte y entrega.
* `/delivery-notes/[id]` `(src/app/(dashboard)/delivery-notes/[id]/page.tsx)` Detalle del albarán, bitácora de cambios de estado, firma táctil digital y botón para facturar.
* `/purchases` `(src/app/(dashboard)/purchases/page.tsx)` Lista de cuentas por pagar de facturas de compras de proveedores.
* `/purchases/new` `(src/app/(dashboard)/purchases/new/page.tsx)` Formulario para capturar y registrar facturas de gastos o compras recibidas.
* `/suppliers` `(src/app/(dashboard)/suppliers/page.tsx)` Directorio de proveedores de la empresa con saldos acumulados de deuda.
* `/suppliers/[id]` `(src/app/(dashboard)/suppliers/[id]/page.tsx)` Ficha del proveedor, desglose de compras pendientes y egresos aplicados.
* `/receivables` `(src/app/(dashboard)/receivables/page.tsx)` Pantalla de cobranzas. Lista rápida de facturas emitidas sin cobrar con accesos directos para aplicar pagos parciales.
* `/pos` `(src/app/(dashboard)/pos/page.tsx)` Punto de Venta optimizado para móviles (pantalla táctil rápida para facturar al contado).
* `/reports` `(src/app/(dashboard)/reports/page.tsx)` Panel analítico. Gráficos de desglose de ITBMS cobrado, cobros por método de pago y rankings de productos/clientes.
* `/settings` `(src/app/(dashboard)/settings/page.tsx)` Consola de configuraciones. Ajuste de RUC de la empresa, credenciales PAC (usuario/contraseña DGI), integraciones de POS, webhook y WhatsApp.
* `/profile` `(src/app/(dashboard)/profile/page.tsx)` Edición de perfil de usuario (nombre y contraseña).
* `/help` `(src/app/(dashboard)/help/page.tsx)` Centro de ayuda interactivo. FAQS de facturación electrónica y formulario para enviar tickets de soporte.
* `/research-hub` `(src/app/(dashboard)/research-hub/page.tsx)` Repositorio de normativas legales de la DGI y manuales técnicos para el usuario.

### Rutas del Super Administrador (`admin/`)
* `/admin/empresas` `(src/app/admin/empresas/page.tsx)` Consola para listar e impersonar empresas registradas en el SaaS.
* `/admin/users` `(src/app/admin/users/page.tsx)` Panel para gestionar usuarios, cambiar roles globales o suspender accesos.
* `/admin/billing` `(src/app/admin/billing/page.tsx)` Monitor de consumo de planes SaaS, límites mensuales y facturación de inquilinos.
* `/admin/audit` `(src/app/admin/audit/page.tsx)` Visor del log completo de transacciones y auditoría del sistema.

---

## 4. FUNCIONA DE VERDAD

A nivel de base de datos e interfaz, los siguientes módulos operan de inicio a fin:

1. **Autenticación e Impersonación:**
   * Inicio y cierre de sesión seguro mediante Firebase.
   * Auto-aprovisionamiento de registros de PostgreSQL (`Empresa` y `Usuario`) al iniciar sesión por primera vez con Google/Email.
   * Impersonación transparente de inquilinos para el rol `super_admin` mediante la cookie `x-impersonation` inyectada en `getTenantContext()`.
2. **Dashboard Financiero:**
   * Consultas dinámicas scoped por `empresaId` que calculan de forma real las ventas, cobros, pendientes y vencidos.
   * Gráfico de líneas temporales generado a partir de cobros y facturas existentes en la base de datos.
3. **Gestión de Clientes y Proveedores:**
   * Formularios de creación y edición que guardan directamente en PostgreSQL.
   * Listados de clientes y proveedores con ordenación, paginación y búsqueda real que impactan las consultas de facturas.
4. **Catálogo de Productos e Inventarios:**
   * Creación, edición y borrado de productos.
   * Subida de imágenes a la galería vinculada al producto.
   * Kárdex de movimientos de inventario que registra entradas y salidas reales de stock.
5. **Creación de Documentos y Secuenciación:**
   * Formulario de facturación que calcula subtotales, ITBMS y totales.
   * Generación de números secuenciales únicos y correlativos usando transacciones de base de datos en la tabla `Secuencia` para evitar duplicados.
   * Discriminación automática: genera Facturas Electrónicas (`FE`) si el plan de la empresa es de pago y tiene DGI configurado, o Recibos de control interno (`REC` / `local`) si está en el plan gratuito.
6. **Mecanismo de Cobranza (Cuentas por Cobrar):**
   * Registro de abonos o pagos totales a facturas pendientes. Afecta el saldo disponible de la factura (`saldoPendiente`), el saldo consolidado del cliente, crea una fila en la tabla `Pago` y guarda la acción en la bitácora de `Auditoria`.
7. **Compras y Gastos:**
   * Registro de facturas de compras de proveedores que aumentan el saldo pendiente de cuentas por pagar y disminuyen el stock de catálogo del producto.
   * Registro de pagos a proveedores (`PagoProveedor`) que disminuye el saldo pendiente del proveedor en la base de datos.
8. **Cotizaciones y Proformas:**
   * Creación completa de cotizaciones con ítems libres.
   * Conversión automática de cotizaciones a Pedidos de Venta.
9. **Albaranes (Notas de Entrega):**
   * Creación de albaranes de despacho y flujo de estados (pendiente -> entregado/facturado).
   * Agrupación y conversión de múltiples albaranes del mismo cliente en una única factura consolidada.
10. **Reportes Analíticos:**
    * Gráficos dinámicos basados en la agregación de datos reales de facturas, cobros e ítems consumidos del inquilino activo.

---

## 5. SOLO UI O ROTO (Simulado o Mokeado)

Las siguientes funciones se despliegan en la pantalla pero están **mockeadas**, **simuladas en cliente**, o carecen de lógica real de backend:

1. **Integración con Proveedor Autorizado de Certificación (PAC) y DGI (Facturación Electrónica):**
   * **Flujo:** En la pantalla de detalles de factura, los botones "Firmar XML" y "Autorizar DGI" ejecutan llamadas a endpoints de API de Next.js, pero estos están mockeados.
   * **Archivos implicados:**
     * [sign/route.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/api/v1/invoices/[id]/sign/route.ts#L29-L38): Devuelve una cadena XML firmada hardcodeada (`mockSignedXml`).
     * [authorize/route.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/api/v1/invoices/[id]/authorize/route.ts#L70-L71): Genera un CUFE estático mock (`mockCufe`) y una URL del visor DGI ficticia (`mockQrUrl`). No se comunica con APIs externas SOAP/REST de la DGI ni de ningún PAC.
2. **Sincronización con Puntos de Venta (POS) Externos:**
   * **Flujo:** Los botones para conectar y sincronizar Loyverse, Square, WooCommerce y Shopify POS en Configuración no tienen integraciones reales de API.
   * **Archivos implicados:**
     * [pos.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/pos.ts#L125-L137): Las funciones `syncPOSProducts`, `syncPOSSales` y `syncPOSInventory` simulan la importación de datos utilizando delays y números aleatorios (`Math.random()`), insertando registros de éxito artificiales en la tabla `PosSyncLog`.
3. **Inicio de Sesión Biométrico (Passkey):**
   * **Flujo:** El botón de huella digital en el login móvil ejecuta funciones WebAuthn del navegador (`navigator.credentials.create`), pero no existe validación de llaves públicas ni registro en base de datos.
   * **Archivos implicados:**
     * [login/page.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/(auth)/login/page.tsx#L78-L141): Flujo simulado a nivel de cliente. Guarda un flag en `localStorage` (`erp_passkey_saved`) para decidir si el usuario entra de forma directa, sin validación criptográfica en el servidor.
4. **Envío de Correos a Proveedores:**
   * **Flujo:** El botón para enviar estados de cuenta o facturas de compra por correo electrónico a proveedores.
   * **Archivos implicados:**
     * [suppliers.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/suppliers.ts#L352-L353): La función `sendSupplierEmailAction` simula el proceso de red mediante un retardo (`setTimeout` de 800ms) y devuelve un mensaje de éxito, pero no utiliza ningún servicio de correos (ej. Resend o Sendgrid).
5. **Integraciones de WhatsApp y Webhooks:**
   * **Flujo:** Las secciones para ingresar número/token de WhatsApp y URLs/token de Webhook en Configuración guardan los datos en la tabla `Empresa`, pero no hay código que envíe los mensajes o dispare las llamadas HTTP al ocurrir eventos en la app.
   * **Archivos implicados:**
     * [settings.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/actions/settings.ts#L96-L124): Solo guarda los campos en base de datos.

---

## 6. AUTENTICACIÓN Y ROLES

### Flujo de Autenticación (Dos Capas)
1. **Cliente:** Firebase Auth autentica al usuario. Al iniciar sesión, se llama a la función `setSessionEmail` que inyecta una cookie segura llamada `session_email` conteniendo el correo del usuario.
2. **Servidor:** Cada Server Component o Server Action invoca [context.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/lib/auth/context.ts) (`getTenantContext()`). Esta lee el email de la cookie `session_email`, consulta en PostgreSQL la tabla `Usuario`, verifica que esté activo y devuelve su `userId`, `empresaId`, `role` y si está impersonando.

### Roles de Usuario
* **`vendedor` (Por defecto):** Acceso estándar al dashboard, registro de ventas, catálogo de productos y cobros de su sucursal/caja.
* **`admin`:** Administrador de la empresa. Además del rol vendedor, puede modificar la configuración de la empresa, credenciales DGI PAC, cambiar de plan y crear otros usuarios vendedores de su inquilino.
* **`super_admin` (Global):** Administrador global de la plataforma SaaS. Tiene acceso exclusivo a `/admin` (Auditorías de plataforma, consumo de folios globales, tickets de soporte y empresas) y puede impersonar cualquier tenant inyectando el ID en la cookie `x-impersonation`.

### Aislamiento Multi-tenancy
* **Aislamiento lógico:** Todas las tablas de negocio (Clientes, Facturas, Compras, Productos, Proveedores, etc.) contienen la columna `empresaId`.
* **Seguridad en consultas:** No existe un aislamiento físico de bases de datos. Los accesos se aíslan en las consultas de Prisma inyectando el `empresaId` proveniente del contexto seguro (`getTenantContext()`) en la cláusula `where`.

---

## 7. ERRORES CONOCIDOS Y ADVERTENCIAS

### Advertencias de ESLint
* **Unused Variables:** Múltiples warnings por importaciones y declaraciones declaradas pero no usadas (ej. `Link`, `Plus`, `Calendar`, etc.) en componentes como `ReceivablesList.tsx`, `ReportsDashboard.tsx`, `SupplierDetailClient.tsx` y en acciones como `billing.ts`.
* **React Compiler skipped memoization:** Advertencias en [QuotesList.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/quotes/QuotesList.tsx#L349) y [ClientList.tsx](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/components/clients/ClientList.tsx#L313). El gancho `useReactTable()` devuelve funciones que React Compiler no puede optimizar de forma segura para evitar estados stale de la interfaz, lo cual deshabilita la memoización de estos componentes.
* **Missing Dependencies en useEffect:** Múltiples avisos de dependencias omitidas (`react-hooks/exhaustive-deps`) en listados de clientes y facturas por cobrar.

### Errores de ESLint en Scripts
* **Imports CommonJS (`require`):** Los archivos en la raíz del proyecto [test-dashboard.js](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/test-dashboard.js), [unpack.js](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/unpack.js) y [unpack-app.js](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/unpack-app.js) arrojan error porque las reglas globales exigen módulos ES (`import`) en lugar de `require()`.

### Código Duplicado Evidente
* **Scripts de Descompresión:** [unpack.js](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/unpack.js) (2033 bytes) y [unpack-app.js](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/unpack-app.js) (2024 bytes) contienen exactamente la misma estructura de descompresión zlib, variando únicamente el nombre del archivo de entrada (`ERP Panamá Dashboard.html` vs `ERP Panamá App.html`) y la carpeta destino.

---

## 8. INTEGRACIONES

* **Planes y Suscripciones (PayPal):**
  * **Estado:** Parcialmente implementado.
  * **Detalle:** Existe un webhook configurado en [paypal/route.ts](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/src/app/api/v1/providers/webhooks/paypal/route.ts) para recibir eventos de suscripción y activar planes (`basic`, `pro`) actualizando la base de datos local. Utiliza variables de entorno con planes mockeados en desarrollo (`P-MOCK-BASIC-PLAN`).
* **Facturación Electrónica DGI (Panamá):**
  * **Estado:** Simulado en backend local.
  * **Detalle:** La base de datos guarda correctamente los esquemas y estados (`aceptada`, `anulada`), pero las APIs de Next.js de firmado y autorización devuelven CUFE y XML estáticos simulados. No existe integración web service SOAP/REST real con la DGI o PAC.
* **WhatsApp API:**
  * **Estado:** Solo declarada.
  * **Detalle:** Existe el modelo en base de datos para guardar número y token de WhatsApp en Configuración, pero no hay lógica de envíos de mensajes al facturar o cobrar.
* **Webhooks Externos:**
  * **Estado:** Solo declarada.
  * **Detalle:** Registra la URL y token en Configuración, pero no existe código que dispare llamadas HTTP externas ante eventos.
* **Email de Notificaciones:**
  * **Estado:** Simulado en backend.
  * **Detalle:** Envío de estados de cuenta y correos a proveedores utiliza delays mockeados.
