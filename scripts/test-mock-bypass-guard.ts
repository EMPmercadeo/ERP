/**
 * test-mock-bypass-guard.ts
 *
 * Verifica que el bypass __mockTenantContext en getTenantContext()
 * es ignorado cuando NODE_ENV !== 'test'.
 *
 * Este script se ejecuta intencionalmente SIN fijar NODE_ENV=test,
 * para confirmar que el mock no tiene efecto fuera del entorno de pruebas.
 *
 * Resultado esperado: getTenantContext() no retorna el mock, sino que
 * intenta leer la cookie de sesión real y redirige a /login (o lanza).
 */

// Nota: NO se fija process.env.NODE_ENV = 'test' aquí — ese es el punto del test.
// En tsx, process.env.NODE_ENV es 'development' por defecto en scripts locales.

import { getTenantContext } from '../src/lib/auth/context';

async function runBypassGuardTest() {
    console.log('🔒 Verificando que __mockTenantContext es ignorado fuera de NODE_ENV=test...');
    console.log(`   NODE_ENV actual: "${process.env.NODE_ENV}"`);

    // Inyectar el mock en global como lo haría un atacante
    (global as any).__mockTenantContext = {
        userId: 'attacker-injected-id',
        empresaId: 'attacker-company',
        role: 'super_admin',
        emailVerified: true,
    };

    let bypassed = false;
    let result: unknown = null;

    try {
        result = await getTenantContext();
        // Si llega aquí y el resultado es el mock, el bypass fue exitoso (fallo de seguridad)
        const ctx = result as any;
        if (ctx?.userId === 'attacker-injected-id') {
            bypassed = true;
        }
    } catch (err: any) {
        // Se espera una excepción de redirect() o de cookies() fuera de contexto Next.js
        // Ambas son resultados correctos: el mock fue ignorado
        const isExpectedError =
            err?.message?.includes('NEXT_REDIRECT') ||
            err?.digest?.includes('NEXT_REDIRECT') ||
            err?.message?.includes('cookies') ||
            err?.message?.includes('redirect') ||
            err?.message?.includes('invariant') ||
            err?.message?.includes('headers') ||
            // tsx en CLI lanza este error al intentar leer cookies fuera de Next.js
            String(err).includes('Not implemented');

        if (isExpectedError) {
            console.log('✅ PASS: getTenantContext() ignoró el mock e intentó autenticación real.');
            console.log('         (Lanzó error esperado de contexto Next.js fuera de request HTTP)');
        } else {
            console.error('❌ FAIL: Error inesperado al llamar getTenantContext:', err?.message || err);
            process.exit(1);
        }
        return;
    }

    if (bypassed) {
        console.error('❌ CRITICAL FAIL: El mock __mockTenantContext fue aceptado fuera de NODE_ENV=test.');
        console.error('   Esto significa que el bypass de autenticación está activo en producción.');
        process.exit(1);
    } else {
        // getTenantContext() retornó algo pero no es el mock — podría ser el usuario
        // de la sesión real o un usuario de fallback de desarrollo
        console.log('✅ PASS: getTenantContext() no retornó el mock injected por el atacante.');
    }
}

runBypassGuardTest().catch(err => {
    // Si el error viene de redirect() en Next.js, es resultado correcto
    const isRedirect =
        err?.digest?.includes('NEXT_REDIRECT') ||
        err?.message?.includes('NEXT_REDIRECT') ||
        String(err).includes('NEXT_REDIRECT');

    if (isRedirect) {
        console.log('✅ PASS: getTenantContext() ignoró el mock y ejecutó redirect() a /login.');
        process.exit(0);
    }

    console.error('Fatal error en test:', err);
    process.exit(1);
});
