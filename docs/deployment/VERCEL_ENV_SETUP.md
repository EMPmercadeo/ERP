# Guía de Configuración de Variables de Entorno en Vercel
Esta guía describe los pasos necesarios para configurar las variables de entorno requeridas por el ERP Panamá en la plataforma Vercel.

---

## 1. Instrucciones en la Interfaz de Vercel
1. Inicie sesión en su cuenta de [Vercel](https://vercel.com).
2. Seleccione su proyecto: **`erp`**.
3. Diríjase a la pestaña **`Settings`** (Configuración) en la parte superior.
4. Seleccione **`Environment Variables`** en la barra lateral izquierda.
5. Ingrese cada una de las variables listadas a continuación utilizando la interfaz de creación.

---

## 2. Inventario de Variables a Configurar

### Base de Datos (PostgreSQL)
* **`DATABASE_URL`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview, Development
  * **Descripción:** Cadena de conexión principal a PostgreSQL con SSL activo (ej. `postgresql://user:pass@host:port/db?sslmode=require`).
* **`DIRECT_URL`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview, Development
  * **Descripción:** Cadena de conexión directa (sin pooler) para ejecutar migraciones Prisma.

### Firebase (Autenticación y Administración)
* **`FIREBASE_SERVICE_ACCOUNT_KEY`**
  * **Tipo:** Privada (Cifrada)
  * **Ambientes:** Production, Preview
  * **Descripción:** Contenido completo del archivo JSON de la cuenta de servicio de Firebase generado en Google Cloud Console. Debe ingresarse como una sola línea JSON compacta.
* **`NEXT_PUBLIC_FIREBASE_API_KEY`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development
* **`NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development
* **`NEXT_PUBLIC_FIREBASE_PROJECT_ID`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development
* **`NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development
* **`NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development
* **`NEXT_PUBLIC_FIREBASE_APP_ID`**
  * **Tipo:** Pública
  * **Ambientes:** Production, Preview, Development

### Límite de Tasa Distribuido (Upstash Redis)
* **`UPSTASH_REDIS_REST_URL`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview (use base separada en Preview si es posible)
  * **Descripción:** URL REST del endpoint de Upstash Redis (ej. `https://your-db.upstash.io`).
* **`UPSTASH_REDIS_REST_TOKEN`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Token de acceso REST para Upstash Redis.
* **`RATE_LIMIT_ENABLED`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview (Valor: `true`)

### Almacenamiento Seguro (Vercel Blob)
* **`BLOB_READ_WRITE_TOKEN`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Token de acceso generado desde el panel de almacenamiento Vercel Blob.
* **`STORAGE_PROVIDER`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview (Valor: `remote`), Development (Valor: `local`)

### Correo Transaccional (SMTP)
* **`SMTP_HOST`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Dirección del servidor de SMTP (ej. `smtp.resend.com` o `smtp.gmail.com`).
* **`SMTP_PORT`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview (Ej. `587` o `465`).
* **`SMTP_SECURE`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview (Valor: `true` si usa puerto 465, o `false` para 587).
* **`SMTP_USER`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Cuenta de correo o usuario de autenticación.
* **`SMTP_PASSWORD`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Contraseña de aplicación o clave SMTP.
* **`SMTP_FROM_EMAIL`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Correo verificado del remitente (ej. `Soporte <soporte@tudominio.com>`).

### Seguridad y Llaves Internas
* **`ENCRYPTION_KEY`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Clave de 32 bytes para cifrar llaves API de la base de datos local (ej. Yappy).
* **`SUPERADMIN_CLAIM_CODE`**
  * **Tipo:** Privada
  * **Ambientes:** Production, Preview
  * **Descripción:** Código seguro necesario para activar la cuenta inicial de Super Administrador.

---

## 3. Despliegue tras Configuración
**IMPORTANTE:** Cada vez que agregue o modifique una variable en Vercel, debe hacer un **Redeploy** (Redespliegue) de la aplicación para que los cambios surtan efecto en el contenedor de producción. Las variables no se actualizan en caliente.
