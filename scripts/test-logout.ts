// Must be first line — sets test environment before modules are evaluated
(process.env as any).NODE_ENV = 'test';

import { deleteSessionEmail } from '../src/lib/actions/auth';
import { adminAuth } from '../src/lib/firebase/admin';

async function runLogoutTest() {
    console.log('🚀 Iniciando pruebas de flujo y manejo de errores en Logout...');
    let passedCount = 0;
    let failedCount = 0;

    const originalVerifyCookie = adminAuth.verifySessionCookie;
    const originalRevokeTokens = adminAuth.revokeRefreshTokens;
    const nextHeaders = require('next/headers');
    const originalCookies = nextHeaders.cookies;

    try {
        // --- ESCENARIO 1: Revocación Exitosa ---
        console.log('\n🔍 ESCENARIO 1: Logout con revocación exitosa...');
        
        adminAuth.verifySessionCookie = async () => ({
            email: 'test-logout@test.com',
            uid: 'uid-test-logout'
        } as any);

        let revokedTokensCalled = false;
        adminAuth.revokeRefreshTokens = async (uid) => {
            if (uid === 'uid-test-logout') {
                revokedTokensCalled = true;
            }
        };

        let cookiesDeleted: string[] = [];
        nextHeaders.cookies = async () => ({
            get: () => ({ value: 'active-session-token' }),
            delete: (name: string) => {
                cookiesDeleted.push(name);
            }
        });

        const resSuccess = await deleteSessionEmail();

        if (resSuccess.success === true && resSuccess.revoked === true && revokedTokensCalled && cookiesDeleted.includes('session_token') && cookiesDeleted.includes('session_email')) {
            console.log('💚 PASS: Logout exitoso. Cookies eliminadas locales y refresh tokens revocados.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Falló la validación del logout exitoso:', { resSuccess, revokedTokensCalled, cookiesDeleted });
            failedCount++;
        }

        // --- ESCENARIO 2: Fallo en Revocación de Firebase ---
        console.log('\n🔍 ESCENARIO 2: Logout cuando la revocación de Firebase falla...');
        
        adminAuth.verifySessionCookie = async () => ({
            email: 'test-logout@test.com',
            uid: 'uid-test-logout-fail'
        } as any);

        adminAuth.revokeRefreshTokens = async () => {
            throw new Error('Firebase Auth API is down / network failure');
        };

        cookiesDeleted = []; // reset tracking
        const resFail = await deleteSessionEmail();

        if (resFail.success === true && resFail.revoked === false && cookiesDeleted.includes('session_token') && cookiesDeleted.includes('session_email')) {
            console.log('💚 PASS: Cookies locales eliminadas incluso si falla Firebase Auth. No se expuso error interno.');
            passedCount++;
        } else {
            console.error('❌ FAIL: El fallo de Firebase causó un crash o no eliminó cookies locales:', { resFail, cookiesDeleted });
            failedCount++;
        }

    } finally {
        adminAuth.verifySessionCookie = originalVerifyCookie;
        adminAuth.revokeRefreshTokens = originalRevokeTokens;
        nextHeaders.cookies = originalCookies;
    }

    console.log(`\n🎉 Resumen de Pruebas de Logout: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

runLogoutTest().catch(err => {
    console.error('Error fatal en test:', err);
    process.exit(1);
});
