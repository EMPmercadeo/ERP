---
name: ERP Panamá
description: ERP de facturación electrónica DGI para PyMEs panameñas — contabilidad, inventario, bancos y POS
colors:
  brand-900: "#071E3D"
  brand-800: "#0C2E5E"
  brand-700: "#073674"
  brand-600: "#12509E"
  brand-500: "#1B6BD6"
  brand-300: "#4E9BF5"
  brand-100: "#DCE8FA"
  brand-50: "#F0F5FD"
  background: "#F7F8FB"
  ink: "#101A2B"
  ink-muted: "#6D7A8C"
  surface: "#FFFFFF"
  surface-subtle: "#FBFCFD"
  surface-light: "#EDF1F7"
  surface-muted: "#E7EAF0"
  border: "#E7EAF0"
  border-soft: "#F2F4F8"
  input: "#D5DAE4"
  success: "#12805C"
  success-bg: "#E7F5EF"
  warning: "#8A5700"
  warning-bg: "#FBF0DC"
  warning-dot: "#C98A16"
  info: "#12509E"
  info-bg: "#E8F0FD"
  danger: "#B4262B"
  danger-bg: "#FCEDEC"
  destructive: "#B4262B"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "20px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.07em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "8px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-500}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 12px"
    height: "32px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 18px"
  status-badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "20px"
  status-badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "20px"
  status-badge-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.sm}"
    padding: "0 8px"
    height: "20px"
---

# Design System: ERP Panamá — v2

## 1. Overview

**Creative North Star: "La Bóveda Corporativa"**

El sistema entero se comporta como una bóveda de banco: azul profundo, superficies planas y frías, cada elemento con su lugar exacto. La solidez no se declara con ornamento — se transmite por la ausencia de ruido visual: jerarquía tipográfica estricta, una única familia sans-serif, y un azul de marca que aparece con disciplina, nunca decorativo. La confianza del usuario (dueño de PyME, contador, cajero) se gana con precisión repetible, no con personalidad llamativa.

El sistema rechaza explícitamente cualquier señal de informalidad: gradientes, iconografía juguetona, o inconsistencias entre pantallas — cualquiera de esas lecturas se traduce, en un ERP fiscal, en "este sistema también podría equivocarse con mis impuestos."

**Qué cambió en la v2.** La v1 era correcta en intención pero blanda en ejecución: 24px de aire dentro de cada card, píldoras de colores compitiendo con las cifras, botones que rebotaban al presionarlos, sombras difusas de 20px. En una pantalla de captura rápida (POS, líneas de factura) eso se lee como lentitud. La v2 aprieta: menos aire, menos radio, menos sombra, tipografía más chica y más precisa. La densidad ES la seriedad.

**Key Characteristics:**
- Una sola escala azul (900 → 50), con el azul de acción separado del azul de marca
- Superficies blancas y grises fríos, sin calidez decorativa
- Densidad alta: 13.5px de base, filas de 44px, botones de 32px
- Elevación de dos niveles y siempre subordinada al borde
- Colores de estado reservados exclusivamente para semántica de datos (DGI, pagos, inventario), nunca decorativos

## 2. Colors

Paleta restringida a **una sola familia azul** más neutros fríos y cuatro colores de estado que existen solo para comunicar semántica de datos.

### Escala azul
- **brand-900 Bóveda** (`#071E3D`): fondo del sidebar en modo oscuro, superficies de máximo contraste.
- **brand-800** (`#0C2E5E`): totales, cifras de cierre, fondos azules densos.
- **brand-700 Ancla** (`#073674`): el azul histórico de la marca. Se conserva para logo, PDF y documentos impresos — donde la identidad importa más que la interacción.
- **brand-600** (`#12509E`): acción presionada, enlaces, texto info.
- **brand-500 Acción** (`#1B6BD6`): botones primarios, anillo de foco, ítem activo. Es el azul con el que el usuario interactúa.
- **brand-300** (`#4E9BF5`): indicadores sobre fondo navy, primario en modo oscuro.
- **brand-100 / brand-50** (`#DCE8FA` / `#F0F5FD`): fondos de acento, hover de ítems de navegación.

**Marca ≠ acción.** El `brand-700` identifica; el `brand-500` invita a hacer clic. Separarlos es lo que evita que la interfaz se vea uniformemente azul y que nada destaque.

### Neutral
- **Fondo** (`#F7F8FB`): fondo base de la aplicación.
- **Tinta** (`#101A2B`): texto principal.
- **Tinta Muted** (`#6D7A8C`): metadatos, placeholders, etiquetas de columna.
- **Superficie** (`#FFFFFF`): cards, popovers, sidebar en modo claro.
- **Superficie Sutil** (`#FBFCFD`): cabecera de tabla, pie de paginación.
- **Superficie Clara / Muted** (`#EDF1F7` / `#E7EAF0`): fondos secundarios, hover de fila.
- **Borde** (`#E7EAF0`) y **Borde Suave** (`#F2F4F8`): el suave separa filas dentro de un mismo bloque; el normal separa bloques distintos.

### Estado (semántico, no decorativo)
Los cuatro se oscurecieron respecto a la v1 hasta alcanzar **4.5:1 sobre su propio fondo** — en la v1 el ámbar y el rojo no pasaban AA y se leían lavados en pantallas de oficina.

- **Éxito** (`#12805C` sobre `#E7F5EF`): facturas aceptadas por DGI, pagos completos, clientes activos.
- **Advertencia** (`#8A5700` sobre `#FBF0DC`, punto `#C98A16`): pendientes, pagos parciales, clientes en mora.
- **Info** (`#12509E` sobre `#E8F0FD`): en procesamiento, cotizaciones enviadas.
- **Peligro** (`#B4262B` sobre `#FCEDEC`): rechazado por DGI, facturas vencidas, clientes bloqueados, eliminar.

### Named Rules
**La Regla del Azul Único.** Una sola familia azul carga toda la identidad. Nunca se introduce un segundo acento de marca; la variación viene de neutros y de los cuatro colores de estado, prohibidos fuera de su rol semántico.

**La Regla del Borde Primero.** Ninguna superficie se separa del fondo con sombra sola: primero el borde de 1px, la sombra solo insinúa profundidad.

## 3. Typography

**Display/Body Font:** Instrument Sans (con fallback `system-ui, sans-serif`)
**Mono Font:** JetBrains Mono (con fallback `ui-monospace, monospace`)

**Character:** Una única familia sans-serif neutra en todos los pesos, acompañada de una mono de trazo abierto para cifras. La seriedad viene de la consistencia y de la densidad, no de la elección tipográfica en sí.

### Hierarchy
- **Display** (600, 20px, line-height 1.2, tracking `-0.015em`): títulos de página (`h1`).
- **Headline** (600, 17px, line-height 1.25): encabezados de sección (`h2`).
- **Title** (600, 14px, line-height 1.3): títulos de card y modal (`h3`, `CardTitle`).
- **Body** (400, 13.5px, line-height 1.5): tablas, formularios, contenido general. Máximo 65-75ch en bloques largos.
- **Label caps** (600, 10.5px, tracking `0.07em`, mayúsculas — utilidad `.label-caps`): cabeceras de columna y etiquetas de KPI.
- **Mono** (400, 12.5px, JetBrains Mono): cifras y códigos.

### Named Rules
**La Regla del Mono para Datos.** Cualquier valor que sea cifra o identificador exacto (montos, CUFE, número de factura, código de producto) se presenta en mono con `font-variant-numeric: tabular-nums` y alineado a la derecha si es numérico. La distinción tipográfica señala "esto es un dato preciso, no prosa", y el tabular hace que las columnas se puedan comparar de un vistazo.

## 4. Elevation

Dos niveles, nada más. La v1 tenía sombras de 20px y 30px de difusión que hacían flotar las cards sobre un fondo casi del mismo color; el efecto era de blandura, no de profundidad.

### Shadow Vocabulary
- **Premium (reposo)** (`0 1px 2px rgba(16,26,43,0.04)`): cards y paneles. Apenas separa; el borde hace el trabajo.
- **Premium Hover** (`0 4px 12px rgba(16,26,43,0.07)`): elementos realmente flotantes (dropdown, popover, modal).

### Named Rules
**La Regla del Borde Primero.** El borde define el límite, la sombra solo sugiere que hay aire debajo. Una superficie sin borde no se arregla subiendo la sombra.

## 5. Components

Los componentes son **densos y precisos**: la respuesta es inmediata y sin adorno — sin rebote, sin escalado, sin transición larga. Lo que comunica certeza es que la acción se registre al instante, no que se anime.

### Buttons
- **Shape:** `rounded-md` (6px); solo el tamaño `xl` usa `rounded-lg` (8px).
- **Sizes:** `sm` 28px · `default` 32px · `lg` 36px · `xl` 44px (exclusivo de POS y del CTA de emisión a la DGI).
- **Primary:** fondo brand-500, borde del mismo tono, texto blanco, hover a brand-600.
- **Secondary:** fondo Superficie Clara, texto Tinta.
- **Outline:** fondo blanco, borde de input, hover al fondo de la app.
- **Ghost:** sin fondo ni borde; solo hover con acento.
- **Dashed:** borde punteado — exclusivo de "Agregar producto / línea" dentro de una tabla editable.
- **Subtle:** fondo blanco con texto destructivo — acción destructiva de baja jerarquía (Cancelar venta, Eliminar fila).
- **Destructive:** fondo `#B4262B`, texto blanco — reservado a eliminar/anular de forma definitiva.
- **Foco:** anillo de 2px en el azul de acción al 40%.

### Status Badges (componente de firma)
Tag **rectangular** (`rounded-sm`, 4px), 20px de alto, 11px/600, con un punto cuadrado de 5px a la izquierda. Sin icono, sin ancho mínimo, sin spinner.

Tres decisiones deliberadas contra la v1: cinco píldoras coloreadas por fila competían con las cifras, que son el dato que de verdad importa; el icono era redundante con el color y la etiqueta; y el spinner de "procesando" llamaba la atención sobre un estado transitorio que el usuario no puede accionar. La columna se alinea porque la celda lo hace, no porque el badge tenga ancho fijo.

### Cards / Containers
- **Corner Style:** `rounded-lg` (8px) — máximo del sistema.
- **Background:** Superficie blanca sobre el fondo de la app.
- **Border + Shadow:** borde 1px siempre, sombra de 2px encima.
- **Padding:** el root no tiene padding propio; cada slot trae el suyo. Header `14px 18px` con divisor suave, content `16px 18px`, footer `10px 16px` sobre Superficie Sutil.
- **Footer:** integrado (paginación, totales), no flotando aparte.

### Inputs / Fields
- **Style:** borde `border-input`, fondo blanco, `rounded-md`, altura 32px.
- **Focus:** borde al azul de acción más anillo de 2px — mismo lenguaje que los botones.
- **Error:** borde y anillo pasan a rojo destructivo (`aria-invalid:border-destructive`).

### Navigation (Sidebar)
Fondo blanco en modo claro (brand-900 en oscuro), ítem activo en brand-600 sobre brand-50, borde derecho visible de 1px. El anillo de foco sigue el azul de acción.

## 6. Do's and Don'ts

### Do:
- **Do** usar `brand-500` para todo lo que se pueda accionar y `brand-700` solo para identidad (logo, PDF).
- **Do** reservar los cuatro colores de estado exclusivamente para semántica de datos DGI/pagos/inventario.
- **Do** usar mono tabular para toda cifra e identificador exacto, alineado a la derecha si es numérico.
- **Do** poner borde antes que sombra en cualquier superficie nueva.
- **Do** preferir la densidad: si dudas entre 16px y 24px de aire, es 16px.

### Don't:
- **Don't** introducir un segundo color de marca o acento decorativo.
- **Don't** usar gradientes, glassmorphism, o iconografía juguetona.
- **Don't** animar la pulsación de un botón (`active:scale`, `translate-y`): en captura rápida el rebote se acumula y se lee como lentitud.
- **Don't** mezclar familias tipográficas fuera de Instrument Sans / JetBrains Mono.
- **Don't** subir el radio por encima de 8px ni la sombra por encima de los dos niveles definidos.

## 7. Migración v1 → v2

Los **nombres de token no cambiaron**: `bg-primary`, `text-muted-foreground`, `border-border`, `bg-success-bg` y compañía siguen funcionando en los ~200 sitios donde ya se usaban. Lo que cambió es su valor.

| v1 | v2 | Nota |
|---|---|---|
| `brand-1` = `#073674` | alias de `brand-500` (`#1B6BD6`) | sigue funcionando; en código nuevo usar `brand-500` |
| `brand-2` / `brand-3` | alias de `brand-800` / `brand-900` | idem |
| `brand-bg-blue` | alias de `brand-800` | idem |
| `--radius` 8px | 6px | `rounded-xl` y superiores ahora topan en 8px |
| botón `h-9`, texto 14px | `h-8`, texto 12.5px | tamaño `xl` para POS y emisión DGI |
| `StatusBadge showIcon` | prop no-op | se conserva para no editar las llamadas existentes |
| `shadow-premium` 20px | 2px | mismo nombre, valor nuevo |
| Card `py-6 gap-6` | padding por slot | header/content/footer traen el suyo |
| Geist / Geist Mono | Instrument Sans / JetBrains Mono | las variables CSS `--font-geist-*` se conservan |

### Cambios estructurales (aplicados)

1. **`KpiCard` → `StatStrip`.** Las cuatro cards del dashboard son ahora una sola tira de cuatro celdas separadas por líneas de 1px (`components/dashboard/StatStrip.tsx`). `KpiCard.tsx` se eliminó. La sparkline bajó de 54px a 26px: es contexto, no protagonista.
2. **Sidebar.** Ítem de 40px a 32px, barra del activo de 4px a 2px, etiquetas de grupo con `.label-caps`.
3. **Topbar.** De 64px a 56px, con el título de página a la izquierda en caja alta y baja (antes iba en versalitas espaciadas y se leía como una etiqueta más). `Content` y los seis skeletons de `loading.tsx` se ajustaron a la nueva altura para que la página no salte al cargar.
4. **Tablas.** La densidad vive en la primitiva `components/ui/table.tsx`, no en cada lista: cabecera de 32px con `.label-caps` sobre Superficie Sutil, filas de 44px separadas por el borde suave. Se retiraron las clases redundantes de `TableHead` en 18 componentes que se las repetían — era la razón por la que ninguna tabla del sistema medía igual que otra.
   - `TableCellNumeric` / `TableHeadNumeric` encapsulan la Regla del Mono para Datos (mono tabular a la derecha) para que ninguna lista tenga que acordarse de las tres clases.
   - `PaginationBar` pasó a los tokens de `CardFooter` (Superficie Sutil + borde superior), así que se lee como el pie de la tabla y no como una barra suelta debajo.
