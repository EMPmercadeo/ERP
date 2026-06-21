# Inventario de Componentes y Páginas - ERP Panamá

Este documento lista de forma organizada todas las rutas de la aplicación, los componentes visuales principales y las dependencias de interfaz instaladas para la revisión.

---

## 1. Inventario de Páginas y Rutas (`src/app/`)

### A. Autenticación y Cuentas
- **`/login` (Página de Acceso)**:
  - Formulario de autenticación limpio y centrado.
- **`/register` (Página de Registro)**:
  - Formulario para creación de nueva Empresa y cuenta de usuario Super Admin.

### B. Dashboard Principal
- **`/dashboard` (Escritorio Principal)**:
  - Visualización rápida de consumo de documentos mensuales vs límites del plan.
  - Tarjetas de métricas clave (Total Facturado, Recaudación, Cuentas por Cobrar).
  - Gráficos mensuales e historial de transacciones recientes.

### C. Ventas e Ingresos
- **`/invoices` (Listado de Facturas)**:
  - Historial de facturas electrónicas y notas de crédito emitidas. Paginación y búsqueda server-side.
- **`/invoices/new` (Emisión de Factura)**:
  - Formulario con selector interactivo de cliente (buscador en tiempo real), selección de sucursal, caja, y tabla interactiva de ítems dinámicos con cálculos automáticos de subtotal, descuentos, ITBMS y total neto.
- **`/invoices/[id]` (Detalle de Factura)**:
  - Visualización del comprobante electrónico emitido con su estado DGI, CUFE, código QR y visor de PDF nativo.
- **`/quotes` (Listado de Cotizaciones)**:
  - Registro de ofertas a clientes. Paginación y búsqueda en base de datos.
- **`/quotes/new` (Emisión de Cotización)**:
  - Formulario de creación con selector y cálculo de totales.
- **`/quotes/[id]` (Detalle de Cotización)**:
  - Visualización de la cotización y exportación/impresión.

### D. Directorios y Tablas Auxiliares
- **`/clients` (Listado de Clientes)**:
  - Tabla de clientes con saldos pendientes, estados visuales (Activo, Moroso, Bloqueado) y opciones del menú desplegable.
- **`/clients/[id]` (Detalle de Cliente)**:
  - Tablero resumen del cliente. Pestaña de información general, historial de facturas y libro de Estado de Cuenta (running balance).
- **`/products` (Catálogo de Productos)**:
  - Listado de productos con código interno, costo, precio de venta y tasa impositiva ITBMS asociada.

### E. Configuración y Reportes
- **`/settings` (Configuración General)**:
  - Formulario de datos de la empresa, selección de ambiente fiscal (Pruebas, Producción) y credenciales de DGI/PAC (usuario PAC, contraseña PAC, carga de certificado digital).
  - Información y selección de planes de suscripción.
- **`/reports` (Reportes Financieros)**:
  - Generador de reportes en PDF y vistas analíticas.

---

## 2. Inventario de Componentes y Dónde se Usan (`src/components/`)

### A. Componentes UI Reutilizables (`src/components/ui/`)
Estos componentes forman el kit base de la interfaz (estilo shadcn) y son consumidos en toda la aplicación:
- **`button.tsx`**: Botones con variantes de color (primary, secondary, destructive, outline, ghost, link).
- **`badge.tsx`**: Etiquetas de estado y colores semánticos (success, warning, destructive, neutral).
- **`status-badge.tsx`**: Variante específica para estados fiscales de DGI (Aceptada, Rechazada, Pendiente, Borrador, Anulada).
- **`card.tsx`**: Contenedor estándar con cabecera, contenido y pie de página.
- **`table.tsx`**: Conjunto de etiquetas HTML semánticas estilizadas con Tailwind para listados.
- **`dialog.tsx` / `sheet.tsx`**: Modales y barras laterales interactivas para formularios rápidos.
- **`dropdown-menu.tsx`**: Menús flotantes para acciones contextuales (tres puntos).
- **`form-field.tsx` / `input.tsx` / `textarea.tsx` / `select.tsx` / `radio-group.tsx`**: Campos interactivos de formularios.
- **`empty-state.tsx` / `error-state.tsx`**: Vistas de estado para listas vacías o con fallos de carga.
- **`tooltip.tsx`**: Globos informativos al pasar el cursor.
- **`calendar.tsx` / `popover.tsx`**: Selector de fechas.
- **`progress.tsx`**: Barra de progreso para visualización de límites de consumo.

### B. Componentes del Módulo de Clientes (`src/components/clients/`)
- **`ClientList.tsx`**: Se usa en `/clients`. Tabla interactiva con búsqueda por texto y paginación real basada en base de datos.
- **`EditClientForm.tsx`**: Se usa en `/clients/[id]/edit`. Formulario para modificar datos generales del cliente.
- **`ImportClientsDialog.tsx`**: Se usa en `/clients` para cargar clientes masivamente vía Excel.

### C. Componentes del Módulo de Facturas (`src/components/invoices/`)
- **`InvoiceList.tsx`**: Se usa en `/invoices`. Tabla con filtros por estado DGI y paginación real.
- **`InvoiceForm.tsx`**: Se usa en `/invoices/new`. Formulario complejo de facturación con buscador predictivo de clientes e inserción dinámica de productos.
- **`ImportInvoicesDialog.tsx`**: Se usa en `/invoices`. Diálogo para subir archivos.

### D. Componentes del Módulo de Cotizaciones (`src/components/quotes/`)
- **`QuotesList.tsx`**: Se usa en `/quotes`. Tabla de cotizaciones con filtros, acciones rápidas de cambio de estado y reenvío.

### E. Componentes de Estructura Comunes (`src/components/layout/`)
- **`Sidebar.tsx`**: Panel lateral izquierdo con los enlaces de navegación, logotipo y selector de temas/empresas.
- **`Topbar.tsx`**: Barra superior que indica la sección actual y el perfil del usuario.
- **`Content.tsx`**: Envoltorio que limita el ancho responsivo y aplica el espaciado interno estándar.

---

## 3. Librerías de UI Instaladas (Dependencies)

El proyecto cuenta con las siguientes dependencias de diseño e interacción declaradas en `package.json`:
- **Radix UI Primitives** (Headless components accesibles):
  - `@radix-ui/react-avatar`
  - `@radix-ui/react-dialog`
  - `@radix-ui/react-dropdown-menu`
  - `@radix-ui/react-label`
  - `@radix-ui/react-popover`
  - `@radix-ui/react-progress`
  - `@radix-ui/react-radio-group`
  - `@radix-ui/react-select`
  - `@radix-ui/react-separator`
  - `@radix-ui/react-slot`
  - `@radix-ui/react-tabs`
  - `@radix-ui/react-tooltip`
- **Iconografía**:
  - `lucide-react`
- **Notificaciones**:
  - `sonner`
- **Manejo de Fechas y Calendario**:
  - `react-day-picker`
  - `date-fns`
- **Utilidades CSS**:
  - `tailwind-merge` (fusión inteligente de clases)
  - `clsx` (construcción condicional de clases)
  - `class-variance-authority` (administración de variantes de componentes)
- **Generación de Reportes y PDF**:
  - `@react-pdf/renderer` (renderización de documentos PDF nativos en React)
