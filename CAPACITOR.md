# Guía de Empaquetado Móvil con Capacitor - ERP Panamá

Este documento detalla los pasos y decisiones arquitectónicas necesarias para compilar y empaquetar la aplicación Next.js de ERP Panamá como una aplicación móvil nativa híbrida para Android e iOS utilizando **Capacitor**.

---

## 1. Decisiones de Arquitectura

Dado que la aplicación está construida sobre **Next.js (App Router)** y depende de:
1. **Server Actions** para interacción con la base de datos y lógica del lado del servidor.
2. **Conexiones directas a la base de datos** mediante Prisma ORM en el servidor.
3. **Mecanismos de autenticación seguros** a través de Firebase/Session tokens.

No es viable realizar una exportación estática de Next.js (`output: 'export'`) porque inhabilitaría todas las características de servidor. 

### Solución Híbrida: WebView Remota
Configuramos Capacitor para cargar la URL del servidor de producción directamente dentro del WebView nativo de la aplicación.
Esto nos permite:
* Conservar el 100% de la funcionalidad de Server Actions, Prisma y autenticación dinámica.
* Desplegar actualizaciones instantáneas de la interfaz y lógica en caliente (sin forzar al usuario a descargar actualizaciones desde Google Play o App Store).
* Habilitar soporte para plugins nativos de Capacitor (cámara, escáner, almacenamiento nativo, etc.) directamente vinculados al host web.

La configuración se establece en `capacitor.config.json` mediante la sección `server`:
```json
{
  "server": {
    "url": "https://erp-panama-demo.vercel.app",
    "cleartext": true
  }
}
```
> [!IMPORTANT]
> Cambia `"https://erp-panama-demo.vercel.app"` por el dominio de producción real de tu SaaS antes de compilar para la tienda oficial.

---

## 2. Requisitos Previos

Antes de comenzar, asegúrate de tener las herramientas de desarrollo de cada plataforma instaladas:
* **Android:** [Android Studio](https://developer.android.com/studio) con SDK Platform 30 o superior y Command Line Tools configurados.
* **iOS:** macOS con [Xcode](https://developer.apple.com/xcode/) y CocoaPods instalados.
* **Node.js:** Versión v18+ y npm.

---

## 3. Guía de Instalación y Configuración

Sigue estos comandos desde la raíz del proyecto para inicializar Capacitor y añadir los SDKs móviles correspondientes:

### Paso A: Instalar dependencias de Capacitor
```bash
npm install @capacitor/core @capacitor/cli
```

### Paso B: Instalar plataformas nativas
```bash
npm install @capacitor/android @capacitor/ios
```

### Paso C: Añadir carpetas de compilación móvil
Dado que cargamos el servidor remoto, creamos una carpeta temporal `public` o `out` como directorio raíz para Capacitor:
```bash
npx cap add android
npx cap add ios
```

### Paso D: Sincronizar configuraciones y plugins
Cada vez que modifiques `capacitor.config.json` o instales un nuevo plugin de Capacitor, sincroniza el proyecto nativo ejecutando:
```bash
npx cap sync
```

---

## 4. Ejecución y Compilación del Proyecto Nativo

### Para Android:
1. Sincroniza los recursos:
   ```bash
   npx cap sync android
   ```
2. Abre el proyecto en Android Studio:
   ```bash
   npx cap open android
   ```
3. Desde Android Studio, puedes ejecutar la aplicación en un emulador virtual, dispositivo físico conectado, o generar el archivo `.apk` / `.aab` de producción mediante `Build > Build Bundle(s) / APK(s)`.

### Para iOS:
1. Sincroniza los recursos:
   ```bash
   npx cap sync ios
   ```
2. Abre el proyecto en Xcode:
   ```bash
   npx cap open ios
   ```
3. Configura tus credenciales de desarrollador en Xcode y compila la app para un simulador de iPhone o dispositivo físico.

---

## 5. Desarrollo Local en Dispositivos

Para probar y depurar la aplicación en tiempo real en un dispositivo físico conectado a tu red local:
1. Encuentra la dirección IP local de tu computadora de desarrollo (ej. `192.168.1.15`).
2. Levanta el servidor local de Next.js en tu red:
   ```bash
   npm run dev -- -H 192.168.1.15
   ```
3. Modifica temporalmente la sección `server.url` en `capacitor.config.json`:
   ```json
   "server": {
     "url": "http://192.168.1.15:3000",
     "cleartext": true
   }
   ```
4. Corre el comando de sincronización y compila para tu dispositivo:
   ```bash
   npx cap sync
   ```
   *Nota: La propiedad `cleartext: true` permite conexiones HTTP inseguras no cifradas durante el desarrollo local.*
