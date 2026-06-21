# ERP Panamá - Design Review Package

Este paquete de revisión de diseño ha sido preparado para un revisor de UI/UX externo. Contiene toda la información visual, componentes de interfaz y configuraciones de estilos de la aplicación sin alterar en absoluto el código fuente de ejecución.

---

## 1. Descripción del Proyecto

**ERP Panamá** es una plataforma web multi-tenant de facturación electrónica y gestión administrativa diseñada para empresas, pymes y profesionales en la República de Panamá. El sistema permite:
- Gestionar clientes y productos de forma centralizada.
- Controlar saldos deudores, abonos y límites de crédito mediante un libro contable cronológico real (Estado de Cuenta).
- Emitir cotizaciones y facturas electrónicas oficiales compatibles con las normativas de la DGI (Dirección General de Ingresos de Panamá) y proveedores PAC autorizados.
- Analizar reportes financieros de ventas, cobros e impuestos (ITBMS).

---

## 2. Technical Stack (Pila Tecnológica)

El proyecto utiliza tecnologías modernas y robustas para garantizar un rendimiento óptimo y escalabilidad:
- **Framework**: [Next.js v16.1.1](https://nextjs.org/) (App Router, Server Actions, force-dynamic rendering).
- **Core de UI**: [React v19.2.3](https://react.dev/).
- **Estilos**: [Tailwind CSS v4](https://tailwindcss.com/) (con soporte nativo para CSS @theme y variables CSS en lugar de archivos configJS tradicionales) y CSS Vanilla.
- **Animaciones**: `tw-animate-css` (plugin de transiciones y microinteracciones de interfaz).
- **Iconografía**: [Lucide React v0.562.0](https://lucide.dev/).
- **Manejo de Tablas**: [@tanstack/react-table v8.21.3](https://tanstack.com/table) (configurada para paginación y ordenación dinámica en servidor).
- **Manejo de Formularios y Validación**: Zod v4.3.5.
- **Persistencia de Base de Datos**: PostgreSQL con Prisma Client v6.0.0.

---

## 3. Lista de Rutas y Páginas Principales

La aplicación sigue la arquitectura del Next.js App Router. Las siguientes rutas y propósitos están estructurados dentro de la carpeta `src/app/`:

- `/` - Página raíz con redireccionamiento inteligente.
- `/login` / `/register` - Vistas de inicio de sesión y registro de cuentas.
- `/dashboard` - Resumen principal con métricas financieras (facturación mensual, facturas generadas vs límites de plan, alertas y accesos rápidos).
- `/clients` - Listado general de clientes con buscador integrado y paginación en servidor.
- `/clients/[id]` - Detalle del cliente. Contiene tres pestañas principales: *Información General*, *Facturas asociadas* y *Estado de Cuenta* (balance acumulado en tiempo real de cargos y abonos).
- `/clients/[id]/edit` / `/clients/new` - Formulario de edición y registro de nuevos clientes.
- `/invoices` - Historial de facturas electrónicas y notas de crédito emitidas.
- `/invoices/new` - Creador de facturas electrónicas con selector de búsqueda rápida de clientes en tiempo real y filas de ítems dinámicas.
- `/quotes` - Listado de cotizaciones activas.
- `/quotes/new` / `/quotes/[id]` - Creación y visualización/descarga de cotizaciones.
- `/products` / `/products/new` - Catálogo de productos, precios y tasas impositivas de ITBMS.
- `/settings` - Configuración de la empresa: credenciales de DGI/PAC (usuario PAC, contraseña PAC, ambiente de pruebas/producción) y visualización del Plan de Suscripción activo (Gratis, Pro).
- `/reports` - Visualización y exportación de reportes estándar.
- `/admin/*` - Panel de control de administración global (empresas, usuarios, auditoría).

---

## 4. Sistema de Diseño Actual (Design System Tokens)

El sistema de diseño está centralizado en el archivo [globals.css](file:///C:/Users/ermom/.gemini/antigravity/scratch/erp-panama/design-review-package/config/globals.css) mediante variables CSS nativas mapeadas en el bloque `@theme` de Tailwind CSS v4.

### A. Paleta de Colores
- **Fondo de Pantalla (`--background`)**: `#F3F4F6` (Gris claro de contraste moderno).
- **Color de Texto Principal (`--foreground` / `--color-brand-1`)**: `#172436` (Azul oscuro profundo / Dark1).
- **Color Primario de Marca (`--primary`)**: `#073674` (Azul institucional / Brand1).
- **Color Secundario de Marca (`--color-brand-2`)**: `#052550` (Azul oscuro / Brand2).
- **Superficie de Tarjetas/Contenedores (`--surface` / `--card`)**: `#FFFFFF` (Blanco puro).
- **Fondo Secundario (`--surface-light` / `--secondary`)**: `#F4F7FA` (Gris azulado muy suave / Light2).
- **Bordes y Divisores (`--surface-muted` / `--border` / `--input`)**: `#DEE4ED` (Muted Gray / Light3).
- **Texto Secundario (`--color-muted-foreground`)**: `#47576B` (Gris apagado / Dark3).
- **Destructivo (`--destructive`)**: `#DC2626` (Rojo de error o eliminación).
- **Estados de Éxito (`--chart-2`)**: `#10B981` (Verde esmeralda).
- **Estados de Advertencia (`--chart-3`)**: `#F59E0B` (Amarillo ámbar).

### B. Tipografías
- **Texto Principal (Sans-Serif)**: Mapeada a `var(--font-geist-sans)` (fuente de interfaz moderna y legible Geist Sans de Vercel).
- **Texto de Códigos / Números (Monospace)**: `var(--font-geist-mono)` (utilizada para números de facturas, montos y RUCs).

### C. Espaciados y Bordes
- **Bordes Redondeados Base (`--radius`)**: `0.5rem` (8px).
- **Modificadores de Bordes**:
  - `radius-sm`: 4px
  - `radius-md`: 6px
  - `radius-lg`: 8px
  - `radius-xl`: 12px
  - `radius-2xl`: 16px

### D. Breakpoints Responsivos (Estándar de Tailwind CSS)
- **Celular / Móvil (`sm`)**: `640px`
- **Tablet / Vertical (`md`)**: `768px`
- **Pantallas Medianas / Laptop (`lg`)**: `1024px`
- **Pantallas Grandes (`xl`)**: `1280px`
- **Pantallas Muy Grandes (`2xl`)**: `1536px`

---

## 5. Restricciones y Elementos NO Modificables

Para el revisor de diseño: **NO se pueden cambiar ni renombrar** los siguientes elementos debido a dependencias con la lógica de negocio, bases de datos e integraciones de backend:

1. **Nombres de Archivos y Rutas**: La estructura de carpetas en `src/app/` define la navegación (App Router). No se deben mover ni renombrar las carpetas entre corchetes (ej: `[id]`, `(dashboard)`).
2. **Nombres de Props e Interfaces de Datos**: Los tipos TypeScript definidos en los componentes (como `ClientData`, `InvoiceData` y `Quote`) deben permanecer intactos ya que corresponden a los modelos y tipos devueltos por Prisma Client y las APIs del servidor.
3. **Clases CSS utilizadas por Javascript**: La clase `.actions-cell` y similares no se deben remover de los elementos de las tablas, ya que el manejador de clics de las filas los usa para distinguir eventos y evitar comportamientos indeseados (por ejemplo, evitar que al hacer clic en el menú de tres puntos se abra el detalle del cliente).
4. **Lógica de Server Actions**: Los imports y llamadas a funciones dentro de `src/lib/actions/` y archivos locales de actions.ts.
5. **Componentes y Elementos de Radix UI**: Las propiedades e IDs de los diálogos e inputs requeridos por los componentes accesibles y las librerías de alertas.
