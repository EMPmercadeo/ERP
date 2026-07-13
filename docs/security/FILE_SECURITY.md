# Seguridad en Carga y Almacenamiento de Archivos - ERP Panamá

Este documento detalla la política de carga de imágenes de productos y documentos adjuntos de la plataforma.

---

## 1. Abstracción del Almacenamiento (`StorageProvider`)
Se utiliza la interfaz `StorageProvider` para soportar múltiples motores:
* **LocalStorageProvider:** Exclusivo para desarrollo y tests. Guarda en `public/uploads/`.
* **RemoteStorageProvider:** Utilizado en producción. Se comunica con Vercel Blob o AWS S3.

---

## 2. Hardening ante Cargas Inseguras
* **Estructura de Directorios:** Los archivos se aíslan físicamente por inquilino en la ruta:
  `empresa/{empresaId}/{tipoDocumento}/{nombreAleatorio}`
* **Rutas no Enumerables (Anti-Path Traversal):** Se renombran los archivos utilizando hashes aleatorios o UUIDs, descartando el nombre provisto por el usuario.
* **Control de Extensiones y Tipos MIME:** Se restringe la carga únicamente a formatos permitidos (`image/png`, `image/jpeg`, `image/webp` y `application/pdf`). Se prohíbe la carga de archivos ejecutables (`.exe`, `.bat`, `.sh`) o imágenes maliciosas vectoriales (`.svg` con código inyectado).
* **URLs Firmadas Expirables:** Para acceder a archivos confidenciales, se generan URLs con tiempos de expiración cortos (TTL de 900 segundos).
* **Fail Closed en Producción:** Si el proveedor de almacenamiento remoto carece de credenciales válidas en producción, el sistema arroja un error estructurado y bloquea la operación.
