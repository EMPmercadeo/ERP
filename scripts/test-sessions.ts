// Must be first line — sets test environment before modules are evaluated
process.env.NODE_ENV = 'test';

import { getTenantContext } from '../src/lib/auth/context';
import { prisma } from '../src/lib/db';
import { adminAuth } from '../src/lib/firebase/admin';

async function runSessionTests() {
    console.log('🚀 Iniciando pruebas automatizadas de seguridad de sesiones...');
    let passedCount = 0;
    let failedCount = 0;

    // Obtener empresa de prueba
    const empresa = await prisma.empresa.findFirst({ where: { ruc: 'TEST-EMP-A' } });
    if (!empresa) {
        console.error('❌ ERROR: Ejecuta primero las pruebas de aislamiento o subida para preparar las empresas de prueba.');
        process.exit(1);
    }

    // Crear un usuario de prueba activo y uno inactivo
    const userActivo = await prisma.usuario.create({
        data: {
            empresaId: empresa.id,
            email: 'activo@test-sessions.com',
            nombre: 'Usuario Activo',
            rol: 'vendedor',
            activo: true,
            passwordHash: 'mock-pass'
        }
    });

    const userInactivo = await prisma.usuario.create({
        data: {
            empresaId: empresa.id,
            email: 'inactivo@test-sessions.com',
            nombre: 'Usuario Inactivo',
            rol: 'vendedor',
            activo: false,
            passwordHash: 'mock-pass'
        }
    });

    const originalVerifyCookie = adminAuth.verifySessionCookie;
    const nextHeaders = require('next/headers');
    const originalCookies = nextHeaders.cookies;

    try {
        // --- TEST 1: Cookie Válida ---
        console.log('\n🔍 TEST 1: Acceso con cookie de sesión válida...');
        (global as any).__mockTenantContext = null;

        adminAuth.verifySessionCookie = async () => ({
            email: 'activo@test-sessions.com',
            email_verified: true,
            uid: 'mock-uid-activo'
        } as any);

        nextHeaders.cookies = async () => ({
            get: () => ({ value: 'valid-mock-cookie' })
        });

        let contextOk = false;
        try {
            const ctx = await getTenantContext();
            if (ctx.userId === userActivo.id && ctx.empresaId === empresa.id && ctx.role === 'vendedor') {
                contextOk = true;
            }
        } catch (e) {
            console.error('Error al obtener contexto válido:', e);
        }

        if (contextOk) {
            console.log('💚 PASS: Cookie válida decodificada y contexto de tenant resuelto correctamente.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se pudo resolver el contexto con cookie válida.');
            failedCount++;
        }

        // --- TEST 2: Cookie Expirada ---
        console.log('\n🔍 TEST 2: Acceso con cookie de sesión expirada...');
        adminAuth.verifySessionCookie = async () => {
            throw new Error('Firebase session cookie has expired.');
        };

        let redirectedExpired = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT') || e.message?.includes('NEXT_REDIRECT') || String(e).includes('NEXT_REDIRECT')) {
                redirectedExpired = true;
            }
        }

        if (redirectedExpired) {
            console.log('💚 PASS: Redirección correcta a /login ante cookie expirada.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se redirigió al usuario con sesión expirada.');
            failedCount++;
        }

        // --- TEST 3: Cookie Revocada ---
        console.log('\n🔍 TEST 3: Acceso con cookie de sesión revocada en Firebase...');
        adminAuth.verifySessionCookie = async () => {
            throw new Error('Firebase session cookie has been revoked.');
        };

        let redirectedRevoked = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT') || e.message?.includes('NEXT_REDIRECT') || String(e).includes('NEXT_REDIRECT')) {
                redirectedRevoked = true;
            }
        }

        if (redirectedRevoked) {
            console.log('💚 PASS: Redirección correcta a /login ante cookie revocada.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se redirigió al usuario con cookie revocada.');
            failedCount++;
        }

        // --- TEST 4: Usuario Inactivo ---
        console.log('\n🔍 TEST 4: Acceso con usuario desactivado (activo = false)...');
        adminAuth.verifySessionCookie = async () => ({
            email: 'inactivo@test-sessions.com',
            email_verified: true,
            uid: 'mock-uid-inactivo'
        } as any);

        let redirectedInactive = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT') && e.digest?.includes('inactive')) {
                redirectedInactive = true;
            }
        }

        if (redirectedInactive) {
            console.log('💚 PASS: Acceso denegado y redirección correcta a /login?error=inactive.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se bloqueó el acceso al usuario desactivado.');
            failedCount++;
        }

        // --- TEST 5: Cookie Manipulada ---
        console.log('\n🔍 TEST 5: Acceso con cookie manipulada / firma inválida...');
        adminAuth.verifySessionCookie = async () => {
            throw new Error('Decoding Firebase session cookie failed. The cookie is invalid.');
        };

        let redirectedManipulated = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT') || e.message?.includes('NEXT_REDIRECT') || String(e).includes('NEXT_REDIRECT')) {
                redirectedManipulated = true;
            }
        }

        if (redirectedManipulated) {
            console.log('💚 PASS: Redirección correcta a /login ante cookie manipulada.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se redirigió al usuario con cookie manipulada.');
            failedCount++;
        }

    } finally {
        // Restaurar mocks
        adminAuth.verifySessionCookie = originalVerifyCookie;
        nextHeaders.cookies = originalCookies;

        // Limpieza de usuarios creados
        await prisma.usuario.deleteMany({
            where: { email: { in: ['activo@test-sessions.com', 'inactivo@test-sessions.com'] } }
        });
        (global as any).__mockTenantContext = null;
        console.log('\n🧹 Limpieza de registros de prueba de sesión completada.');
    }

    console.log(`\n🎉 Resumen de Pruebas de Sesiones: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

runSessionTests().catch(e => {
    console.error('Fatal session test error:', e);
    process.exit(1);
});
