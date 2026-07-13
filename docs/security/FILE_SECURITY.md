# Seguridad en Carga y Almacenamiento de Archivos - ERP Panamá

Este documento detalla la política de carga de imágenes de productos y documentos adjuntos de la plataforma.

---

## 1. Abstracción del Almacenamiento (`StorageProvider`)
Se utiliza la interfaz `StorageProvider` para soportar múltiples motores:
* **LocalStorageProvider:** Exclusivo para desarrollo y tests. Guarda en `public/uploads/`.
* **RemoteStorageProvider:** Utilizado en producción. Se comunica con Vercel Blob o AWS S3.

---

## 2. Hardening ante Cargas Inseguras

**Alcance actual:** el único flujo de subida de archivos implementado en la aplicación es la
imagen de producto (`uploadProductImage` en `src/lib/actions/products.ts`). No existe todavía
un flujo de documentos confidenciales (contratos, expedientes de RRHH, etc.) que use este
mismo `StorageProvider` — si se agrega en el futuro, debe usar rutas privadas y URLs firmadas
como se describe en la sección 4, no el modo público actual.

* **Estructura de Directorios:** Los archivos se aíslan físicamente por inquilino en la ruta
  `products/{empresaId}/{nombreAleatorio}` (Vercel Blob) o `public/uploads/products/{empresaId}/{nombreAleatorio}`
  (almacenamiento local de desarrollo). Antes de esta corrección, todas las empresas
  compartían el mismo prefijo `products/{nombreAleatorio}`; se corrigió para agregar el
  prefijo por `empresaId`.
* **Rutas no Enumerables:** El nombre de archivo combina timestamp + sufijo aleatorio
  (`Date.now()-random`), y Vercel Blob añade además su propio sufijo aleatorio
  (`addRandomSuffix: true`) — el nombre original provisto por el usuario se descarta.
* **Control de Extensiones y Tipos MIME:** Se restringe la carga únicamente a
  `.jpg/.jpeg/.png/.webp`, validando además los *magic bytes* del contenido real del
  archivo (no solo la extensión ni el `Content-Type` del navegador) para bloquear
  polyglots y archivos con extensión falsa. No se acepta `application/pdf` en este flujo
  pese a lo que decía una versión anterior de este documento — revisar si se necesita.
* **Fail Closed en Producción:** Si falta `BLOB_READ_WRITE_TOKEN` (u otras credenciales de
  storage remoto) en producción, `uploadFile()` lanza un error y la subida falla de forma
  explícita en vez de escribir en disco efímero.

## 3. Acceso Público de las Imágenes (decisión de diseño, no pendiente)
Las imágenes de producto se suben a Vercel Blob con `access: 'public'` y **sin** expiración.
Esto es intencional: son fotos de catálogo pensadas para mostrarse en la tienda/POS sin
necesidad de autenticación en cada carga de imagen, no documentos confidenciales. **No se
implementaron URLs firmadas con TTL** (una versión anterior de este documento lo afirmaba
incorrectamente sin que existiera en el código). Si en el futuro se sube algún documento
que sí sea confidencial (cédulas, contratos, comprobantes), ese flujo debe:
1. Usar `access: 'private'` de Vercel Blob (o un bucket S3 privado).
2. Servir el archivo a través de un endpoint propio que valide `empresaId` + permisos y
   genere una URL firmada de corta duración (p. ej. 900s) en cada solicitud — nunca
   guardar la URL firmada de forma permanente en base de datos.
