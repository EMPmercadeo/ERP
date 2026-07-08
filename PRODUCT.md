# Product

## Register

brand

## Users

Dos perfiles conviven en las mismas pantallas:
- **Dueños de PyMEs panameñas y sus contadores**: revisan reportes, concilian bancos, gestionan facturación electrónica DGI y necesitan confiar en que las cifras y el estado fiscal son correctos.
- **Personal operativo/administrativo** (cajeros, vendedores en POS): emiten facturas rápido durante el día a día operativo, con menos tiempo para interpretar pantallas complejas.

El dashboard interno (`(dashboard)`) es la superficie de uso diario para ambos perfiles; la landing pública (`src/app/page.tsx`) es la puerta de entrada para atraer y convencer a nuevas PyMEs de adoptar el sistema.

## Product Purpose

ERP full-stack de facturación electrónica para Panamá: cumplimiento DGI (CUFE, PAC, XML firmado), contabilidad completa (libro diario, libro mayor, balance de comprobación, estado de resultados, balance general), conciliación bancaria, inventario multi-bodega, POS y planes de suscripción (free → emprendedor → negocio → pro → empresa). Éxito = que una PyME panameña pueda facturar, declarar y conciliar sin depender de un contador externo para lo básico, confiando en que el sistema no comete errores fiscales.

## Brand Personality

**Confiable, serio, sólido** — referencia: QuickBooks/SAP, no Notion/Alegra. El tono es corporativo y sobrio porque el dominio (impuestos, dinero, cumplimiento DGI) no perdona la informalidad: cualquier señal visual de descuido (inconsistencias, densidad pobre, jerarquía confusa) se lee como riesgo de que el sistema también sea descuidado con las cifras o el cumplimiento fiscal.

## Anti-references

Sin anti-referencia específica señalada por el usuario. Aplicar criterio estándar: evitar clichés de IA (ver bans de SKILL.md), evitar decoración que compita con la seriedad del dominio (nada de gradientes llamativos, iconografía juguetona fuera de tono).

## Design Principles

1. **Solidez ante lo fiscal**: cada pantalla que toque dinero, impuestos o DGI debe transmitir precisión y control antes que personalidad — la confianza se gana con jerarquía clara y consistencia, no con decoración.
2. **La misma marca en la landing y en el dashboard**: el azul corporativo (`#073674`) y el tono serio deben sentirse como el mismo producto en ambas superficies; la landing vende la solidez que el dashboard después cumple.
3. **Accesible sin infantilizar**: reduce la fricción para el personal operativo (POS, facturación rápida) sin sacrificar la seriedad que busca el dueño/contador — la simplicidad es de flujo, no de tono visual.
4. **Claridad de datos sobre ornamento**: en tablas, reportes y conciliaciones, la legibilidad y jerarquía de la información financiera siempre gana sobre lo decorativo.
5. **Predicar con el ejemplo**: un ERP que promete rigor fiscal debe modelar ese mismo rigor en su propia interfaz — sin inconsistencias, sin estados a medio terminar, sin atajos visibles.

## Accessibility & Inclusion

WCAG 2.1 AA como objetivo estándar: contraste de texto (≥4.5:1 cuerpo, ≥3:1 texto grande), navegación por teclado en formularios y tablas, y soporte de `prefers-reduced-motion` en animaciones. Sin requisitos adicionales más allá del estándar.
