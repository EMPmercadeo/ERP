// Must be first line — sets test environment before modules are evaluated
(process.env as any).NODE_ENV = 'test';

import { deleteSessionEmail, deleteSessionEmailGlobal } from '../src/lib/actions/auth';
import { adminAuth } from '../src/lib/firebase/admin';

async function runLogoutTest() {
    console.log('🚀 Iniciando pruebas de flujo y manejo de errores en Logout (Local y Global)...');
    let passedCount = 0;
    let failedCount = 0;

    const originalVerifyCookie = adminAuth.verifySessionCookie;
    const originalRevokeTokens = adminAuth.revokeRefreshTokens;
    const nextHeaders = require('next/headers');
    const originalCookies = nextHeaders.cookies;

    try {
        // --- ESCENARIO 1: Cierre de Sesión en este Dispositivo (Local) ---
        console.log('\n🔍 ESCENARIO 1: Cerrar sesión en este dispositivo (Local)...');
        
        adminAuth.verifySessionCookie = async () => ({
            email: 'test-logout-local@test.com',
            uid: 'uid-test-logout-local'
        } as any);

        let revokedTokensCalled = false;
        adminAuth.revokeRefreshTokens = async (uid) => {
            revokedTokensCalled = true;
        };

        let cookiesDeleted: string[] = [];
        nextHeaders.cookies = async () => ({
            get: () => ({ value: 'active-session-token' }),
            delete: (name: string) => {
                cookiesDeleted.push(name);
            }
        });

        const resLocal = await deleteSessionEmail();

        if (resLocal.success === true && resLocal.revoked === false && !revokedTokensCalled && cookiesDeleted.includes('session_token') && cookiesDeleted.includes('session_email')) {
            console.log('💚 PASS: Logout local exitoso. Cookies eliminadas y tokens de Firebase permanecen activos (sin revocar).');
            passedCount++;
        } else {
            console.error('❌ FAIL: Falló la validación del logout local:', { resLocal, revokedTokensCalled, cookiesDeleted });
            failedCount++;
        }

        // --- ESCENARIO 2: Cierre de Sesión en todos los Dispositivos (Global - Exitoso) ---
        console.log('\n🔍 ESCENARIO 2: Cerrar sesión global (Todos los Dispositivos)...');
        
        adminAuth.verifySessionCookie = async () => ({
            email: 'test-logout-global@test.com',
            uid: 'uid-test-logout-global'
        } as any);

        let globalRevokedTokensCalled = false;
        adminAuth.revokeRefreshTokens = async (uid) => {
            if (uid === 'uid-test-logout-global') {
                globalRevokedTokensCalled = true;
            }
        };

        cookiesDeleted = [];
        const resGlobal = await deleteSessionEmailGlobal();

        if (resGlobal.success === true && resGlobal.revoked === true && globalRevokedTokensCalled && cookiesDeleted.includes('session_token') && cookiesDeleted.includes('session_email')) {
            console.log('💚 PASS: Logout global exitoso. Cookies eliminadas y tokens de Firebase revocados globalmente.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Falló la validación del logout global:', { resGlobal, globalRevokedTokensCalled, cookiesDeleted });
            failedCount++;
        }

        // --- ESCENARIO 3: Cierre de Sesión Global con fallo de Firebase ---
        console.log('\n🔍 ESCENARIO 3: Cerrar sesión global cuando Firebase falla...');
        
        adminAuth.verifySessionCookie = async () => ({
            email: 'test-logout-global-fail@test.com',
            uid: 'uid-test-logout-global-fail'
        } as any);

        adminAuth.revokeRefreshTokens = async () => {
            throw new Error('Firebase Auth API is down / network failure');
        };

        cookiesDeleted = [];
        const resGlobalFail = await deleteSessionEmailGlobal();

        if (resGlobalFail.success === true && resGlobalFail.revoked === false && cookiesDeleted.includes('session_token') && cookiesDeleted.includes('session_email')) {
            console.log('💚 PASS: Cookies locales eliminadas incluso si falla la revocación en Firebase Auth.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Falló la validación del logout global con error de Firebase:', { resGlobalFail, cookiesDeleted });
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
