import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0];
  }
  const serviceAccountRaw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountRaw) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY no está configurada.');
  }
  const serviceAccount = JSON.parse(serviceAccountRaw);
  return initializeApp({
    credential: cert(serviceAccount),
  });
}

export const adminAuth = getAuth(getAdminApp());
