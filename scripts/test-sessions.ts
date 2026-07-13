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

    try {
        // --- TEST 1: Usuario Desactivado ---
        console.log('\n🔍 TEST 1: Acceso con usuario desactivado (activo = false)...');
        // Mockear el email resuelto de la sesión
        (global as any).__mockTenantContext = null; // Desactivar el bypass directo de tenant context para que use resolveUsuarioPorEmail
        
        // Mockear cookies de next/headers para que devuelvan la cookie simulada
        // En este test usaremos mock de global __mockTenantContext que simula la respuesta de resolveUsuarioPorEmail
        // Pero para probar la lógica real de "!devUser.activo" de context.ts, podemos simular que el email es 'inactivo@test-sessions.com'
        // Mocking the cookies/token verification:
        const originalVerifyCookie = adminAuth.verifySessionCookie;
        adminAuth.verifySessionCookie = async () => ({
            email: 'inactivo@test-sessions.com',
            email_verified: true,
            uid: 'mock-uid-inactivo'
        } as any);

        // Mock cookies() store
        const nextHeaders = require('next/headers');
        const originalCookies = nextHeaders.cookies;
        nextHeaders.cookies = async () => ({
            get: () => ({ value: 'valid-mock-cookie' })
        });

        // Intentar obtener contexto (debería redirigir a /login?error=inactive)
        let redirectedToLogin = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            // Next.js redirect lanza un error especial con digest NEXT_REDIRECT
            if (e.digest?.includes('NEXT_REDIRECT') && e.digest?.includes('inactive')) {
                redirectedToLogin = true;
            } else {
                console.error('Error inesperado durante redirección:', e);
            }
        }

        if (redirectedToLogin) {
            console.log('💚 PASS: Acceso denegado y redirección correcta de usuario desactivado.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se bloqueó el acceso al usuario desactivado.');
            failedCount++;
        }

        // --- TEST 2: Cookie Expirada ---
        console.log('\n🔍 TEST 2: Acceso con cookie de sesión expirada / inválida...');
        adminAuth.verifySessionCookie = async () => {
            throw new Error('Firebase session cookie has expired.');
        };

        let redirectedExpired = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT')) {
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

        // --- TEST 3: Token Revocado ---
        console.log('\n🔍 TEST 3: Acceso con token de sesión revocado en Firebase...');
        adminAuth.verifySessionCookie = async () => {
            throw new Error('Firebase ID Token has been revoked.');
        };

        let redirectedRevoked = false;
        try {
            await getTenantContext();
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT')) {
                redirectedRevoked = true;
            }
        }

        if (redirectedRevoked) {
            console.log('💚 PASS: Redirección correcta a /login ante token revocado.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se redirigió al usuario con token revocado.');
            failedCount++;
        }

        // Restaurar mocks
        adminAuth.verifySessionCookie = originalVerifyCookie;
        nextHeaders.cookies = originalCookies;

    } finally {
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
