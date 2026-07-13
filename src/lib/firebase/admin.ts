import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountRaw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.');
  }
  const serviceAccount = JSON.parse(serviceAccountRaw);
  if (serviceAccount.private_key) {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

let _adminAuth: Auth | null = null;
function getAdminAuth(): Auth {
  if (!_adminAuth) {
    _adminAuth = getAuth(getAdminApp());
  }
  return _adminAuth;
}

// `adminAuth` se expone como un Proxy en vez de una instancia creada al importar el
// módulo. Antes, `export const adminAuth = getAuth(getAdminApp())` se ejecutaba en
// cuanto CUALQUIER archivo importaba este módulo — incluyendo el paso de Next.js
// "Collecting page data" durante el build, que importa todas las rutas API para
// inspeccionarlas sin ejecutar ninguna petición real. Eso hacía fallar el build
// completo en cualquier ambiente sin FIREBASE_SERVICE_ACCOUNT_KEY (p. ej. Preview),
// aunque ninguna petición real necesitara Firebase Admin todavía. Con el Proxy, la
// inicialización (y el error si falta la variable) solo ocurre en el primer uso real,
// dentro de una petición HTTP.
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(_target, prop, _receiver) {
    const instance = getAdminAuth();
    const value = Reflect.get(instance as object, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
