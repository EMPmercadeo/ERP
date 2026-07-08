---
name: ERP Panamá
description: ERP de facturación electrónica DGI para PyMEs panameñas — contabilidad, inventario, bancos y POS
colors:
  brand-primary: "#073674"
  brand-deep: "#052550"
  brand-abyss: "#001835"
  brand-bg-blue: "#002855"
  brand-light: "#0056b3"
  brand-medium: "#004899"
  brand-dark: "#003366"
  background: "#F3F4F6"
  ink: "#172436"
  ink-secondary: "#2D3D53"
  ink-muted: "#47576B"
  surface: "#FFFFFF"
  surface-light: "#F4F7FA"
  surface-muted: "#DEE4ED"
  border: "#DEE4ED"
  success: "#15a378"
  success-bg: "#e9f8f1"
  warning: "#e0901f"
  warning-bg: "#fcf2db"
  info: "#4178e6"
  info-bg: "#edf2fe"
  danger: "#ec6a64"
  danger-bg: "#fdeeec"
  destructive: "#DC2626"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
components:
  button-primary:
    backgroundColor: "{colors.brand-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "8px 16px"
  button-outline:
    backgroundColor: "{colors.background}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "8px 24px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  status-badge-success:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  status-badge-warning:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
  status-badge-danger:
    backgroundColor: "{colors.danger-bg}"
    textColor: "{colors.danger}"
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

# Design System: ERP Panamá

## 1. Overview

**Creative North Star: "La Bóveda Corporativa"**

El sistema entero se comporta como una bóveda de banco: azul profundo, superficies planas y frías, cada elemento con su lugar exacto. La solidez no se declara con ornamento — se transmite por la ausencia de ruido visual: jerarquía tipográfica estricta, una única familia sans-serif, y un azul de marca (`#073674`) que aparece con disciplina, nunca decorativo. La confianza del usuario (dueño de PyME, contador, cajero) se gana con precisión repetible, no con personalidad llamativa.

El sistema rechaza explícitamente cualquier señal de informalidad: gradientes, iconografía juguetona, o inconsistencias entre pantallas — cualquiera de esas lecturas se traduce, en un ERP fiscal, en "este sistema también podría equivocarse con mis impuestos."

**Key Characteristics:**
- Azul corporativo profundo como única marca de identidad, usado con moderación
- Superficies blancas y grises fríos, sin calidez decorativa
- Tipografía Geist única (sans + mono), sin mezcla de familias
- Feedback táctil sutil (compresión de botones, sombras azules suaves) que refuerza precisión, no personalidad
- Colores de estado (éxito/advertencia/info/peligro) reservados exclusivamente para semántica de datos (DGI, pagos, inventario), nunca decorativos

## 2. Colors

Paleta restringida: un azul institucional que carga la identidad, neutros fríos que dominan la superficie, y cuatro colores de estado que existen solo para comunicar semántica de datos.

### Primary
- **Bóveda Azul** (`#073674`): color de marca. Botones primarios, enlaces, anillos de foco, iconos activos del sidebar. Es la única fuente de "color de marca" en toda la interfaz.
- **Bóveda Azul Profundo** (`#052550`): variante oscura del primario; sidebar en modo oscuro, hover states de superficies azules.
- **Abismo** (`#001835`): el azul más oscuro de la escala; reservado para estados de máximo contraste (fondo de sidebar oscuro extremo).

### Neutral
- **Gris Niebla** (`#F3F4F6`): fondo base de la aplicación (`--background`).
- **Tinta Primaria** (`#172436`): texto principal, máximo contraste sobre superficies claras.
- **Tinta Secundaria** (`#2D3D53`): texto de soporte, encabezados de menor peso.
- **Tinta Muted** (`#47576B`): texto terciario, metadatos, placeholders.
- **Superficie** (`#FFFFFF`): cards, popovers, sidebar en modo claro.
- **Superficie Clara** (`#F4F7FA`): fondos secundarios, hover de filas de tabla.
- **Superficie Muted / Borde** (`#DEE4ED`): bordes, separadores, inputs sin foco.

### Estado (semántico, no decorativo)
- **Éxito** (`#15a378` sobre fondo `#e9f8f1`): facturas aceptadas por DGI, pagos completos, clientes activos.
- **Advertencia** (`#e0901f` sobre fondo `#fcf2db`): pendientes, pagos parciales, clientes en mora.
- **Info** (`#4178e6` sobre fondo `#edf2fe`): en procesamiento, cotizaciones enviadas.
- **Peligro** (`#ec6a64` sobre fondo `#fdeeec`, y `#DC2626` para acciones destructivas): rechazado por DGI, facturas vencidas, clientes bloqueados, eliminar.

### Named Rules
**La Regla del Azul Único.** El azul de marca (`#073674` y su familia) es la única fuente de identidad cromática. Nunca se introduce un segundo acento de marca; la variación viene de neutros y de los cuatro colores de estado, que están prohibidos fuera de su rol semántico.

## 3. Typography

**Display/Body Font:** Geist (con fallback `system-ui, sans-serif`)
**Label/Mono Font:** Geist Mono (con fallback `ui-monospace, monospace`)

**Character:** Una única familia sans-serif geométrica y neutra en todos los pesos — sin mezcla de familias, sin serif decorativo. La seriedad viene de la consistencia, no de la elección tipográfica en sí.

### Hierarchy
- **Display** (600, `1.875rem`/30px, line-height 1.2): títulos de página (`h1`), tracking ligeramente ajustado (`-0.01em`).
- **Headline** (600, `1.5rem`/24px, line-height 1.3): encabezados de sección (`h2`).
- **Title** (600, `1.25rem`/20px, line-height 1.3): títulos de card y modal (`h3`, `CardTitle`).
- **Body** (400, `0.875rem`/14px, line-height 1.5): texto de tablas, formularios, contenido general. Máximo 65-75ch en bloques de texto largo.
- **Label** (500, `0.75rem`/12px, Geist Mono): badges de estado, metadatos de tabla, códigos (CUFE, números de factura).

### Named Rules
**La Regla del Mono para Datos.** Cualquier valor que sea un identificador exacto (CUFE, número de factura, código de producto) se presenta en Geist Mono, nunca en el sans-serif de body — la distinción tipográfica señala "esto es un dato preciso, no prosa."

## 4. Elevation

Sistema de elevación sutil y tonal, no dramático: las sombras existen para separar superficies flotantes (cards, popovers, dropdowns) del fondo, pero siempre con un tinte azul muy suave que ancla la sombra a la identidad de marca en vez de usar un gris neutro genérico.

### Shadow Vocabulary
- **Premium (reposo)** (`box-shadow: 0 4px 20px -2px rgba(7,54,116,0.04), 0 2px 6px -1px rgba(7,54,116,0.02)`): elevación por defecto de cards y paneles flotantes.
- **Premium Hover** (`box-shadow: 0 10px 30px -4px rgba(7,54,116,0.08), 0 4px 12px -2px rgba(7,54,116,0.03)`): elevación al interactuar (hover de card, botón elevado).
- **Extra-shallow (`shadow-xs`)**: inputs y botones outline en reposo; casi imperceptible, solo define el borde.

### Named Rules
**La Regla del Tinte Azul.** Ninguna sombra usa negro puro (`rgba(0,0,0,...)`); todas llevan el tinte del azul de marca (`rgba(7,54,116,...)`), incluso en su forma más sutil. Esto es lo que hace que el sistema se sienta de una sola pieza en vez de una plantilla genérica con sombras grises.

## 5. Components

Los componentes son **táctiles y precisos**: el feedback físico (compresión sutil al presionar, sombra que crece en hover) comunica que cada acción quedó registrada con exactitud — no busca personalidad, busca certeza.

### Buttons
- **Shape:** esquinas suavemente curvas (`rounded-lg`, 8px); variantes pequeñas usan `rounded-md` (6px).
- **Primary:** fondo Bóveda Azul (`#073674`), texto blanco, `hover:bg-primary/90`. Padding `8px 16px` (`h-9 px-4`).
- **Secondary:** fondo Superficie Clara, texto Tinta Primaria.
- **Outline:** fondo transparente, borde neutro, hover a color de acento.
- **Ghost:** sin fondo ni borde; solo hover con acento.
- **Destructive:** fondo `#DC2626`, texto blanco — reservado exclusivamente a eliminar/anular.
- **Feedback táctil:** todo botón se comprime levemente al presionar (`active:scale-[0.98]` + `translate-y-[0.5px]`) y muestra anillo de foco de 3px en el azul de marca al 50% de opacidad.

### Status Badges (componente de firma)
Pastilla (`rounded-full`) con fondo e ícono coloreados por estado semántico (éxito/advertencia/info/peligro/neutral), texto en negrita, ancho mínimo fijo (118px) para que las columnas de estado en tablas queden alineadas visualmente. El ícono de "procesando" gira (`animate-spin`); el resto son estáticos. Este es el componente que más carga la semántica de datos DGI/pagos en toda la interfaz — su consistencia es crítica.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** Superficie blanca sobre fondo Gris Niebla.
- **Shadow Strategy:** Premium en reposo, Premium Hover en interacción (ver Elevación).
- **Border:** borde sutil `border-border` (`#DEE4ED`) además de la sombra, no en lugar de ella.
- **Internal Padding:** `24px` vertical, `24px` horizontal en header/content.

### Inputs / Fields
- **Style:** borde neutro (`border-input`), fondo transparente, `rounded-md`, altura `h-9`.
- **Focus:** borde cambia al azul de anillo (`focus-visible:border-ring`) más anillo de 3px (`ring-ring/50`) — mismo lenguaje de foco que los botones, para consistencia entre controles interactivos.
- **Error:** borde y anillo pasan a rojo destructivo (`aria-invalid:border-destructive`).

### Navigation (Sidebar)
Fondo blanco en modo claro (fondo Bóveda Azul Profundo en modo oscuro), ítem activo resaltado con el azul de marca, sin bordes visibles (`sidebar-border: transparent`) para una silueta limpia. El anillo de foco sigue el mismo azul de marca que el resto de controles interactivos.

## 6. Do's and Don'ts

### Do:
- **Do** usar el azul de marca (`#073674`) como única fuente de identidad cromática — botones primarios, enlaces, foco, ítem activo del sidebar.
- **Do** reservar los cuatro colores de estado (éxito/advertencia/info/peligro) exclusivamente para semántica de datos DGI/pagos/inventario, nunca de forma decorativa.
- **Do** usar Geist Mono para cualquier identificador exacto (CUFE, número de factura, código de producto) para señalar "esto es un dato preciso."
- **Do** mantener el tinte azul (`rgba(7,54,116,...)`) en todas las sombras, incluso las más sutiles.
- **Do** mantener el feedback táctil de botones (compresión al presionar) en todo componente interactivo nuevo, para consistencia de "certeza registrada."

### Don't:
- **Don't** introducir un segundo color de marca o acento decorativo — el azul es único y disciplinado.
- **Don't** usar gradientes, glassmorphism, o iconografía juguetona: cualquier informalidad visual se lee como riesgo de descuido fiscal en un ERP de cumplimiento DGI.
- **Don't** usar sombras con negro puro (`rgba(0,0,0,...)`); siempre tinte azul de marca.
- **Don't** mezclar familias tipográficas fuera de Geist/Geist Mono.
- **Don't** usar los colores de estado (éxito/advertencia/info/peligro) para decoración general de UI — están reservados a comunicar el estado real de un dato (factura, pago, cliente).
