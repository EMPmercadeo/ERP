// Must be first line — sets test environment before modules are evaluated
(process.env as any).NODE_ENV = 'test';

import { POST } from '../src/app/api/client-errors/route';
import { NextRequest } from 'next/server';

async function runClientErrorsTest() {
    console.log('🚀 Iniciando pruebas de Endpoint Centralizado de Errores de Cliente...');
    let passedCount = 0;
    let failedCount = 0;

    const createMockRequest = (body: any, ip: string = '127.0.0.1') => {
        const req = new NextRequest('http://localhost/api/client-errors', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'x-forwarded-for': ip,
                'Content-Type': 'application/json'
            }
        });
        return req;
    };

    try {
        // --- TEST 1: Payload Válido ---
        console.log('\n🔍 TEST 1: Envío de payload de error válido y desinfectado...');
        const validPayload = {
            digest: 'digest-12345',
            incidentId: 'inc_test123',
            ruta: '/dashboard/invoices',
            timestamp: new Date().toISOString(),
            versionDespliegue: '1.0.0'
        };

        const res1 = await POST(createMockRequest(validPayload, '192.168.1.1'));
        if (res1.status === 200) {
            console.log('💚 PASS: Payload válido procesado y aceptado con éxito (HTTP 200).');
            passedCount++;
        } else {
            console.error('❌ FAIL: Se rechazó un payload válido:', res1.status);
            failedCount++;
        }

        // --- TEST 2: Payload con Campos Prohibidos ---
        console.log('\n🔍 TEST 2: Envío de payload con campos no autorizados (cookies, stack trace)...');
        const invalidPayload = {
            digest: 'digest-12345',
            incidentId: 'inc_test123',
            ruta: '/dashboard/invoices',
            timestamp: new Date().toISOString(),
            versionDespliegue: '1.0.0',
            stack: 'Error at dashboard/page.tsx line 42', // Prohibido
            cookie: 'session_token=secret_value' // Prohibido
        };

        const res2 = await POST(createMockRequest(invalidPayload, '192.168.1.2'));
        if (res2.status === 400) {
            console.log('💚 PASS: Se rechazó correctamente el payload que contiene campos adicionales (HTTP 400).');
            passedCount++;
        } else {
            console.error('❌ FAIL: Se aceptó un payload con campos prohibidos:', res2.status);
            failedCount++;
        }

        // --- TEST 3: Rate Limiting ---
        console.log('\n🔍 TEST 3: Validación del límite de peticiones (Rate Limiting)...');
        const clientIp = '10.0.0.1';
        let hitLimit = false;

        // Mandar 12 peticiones del mismo IP seguidas (límite es 10)
        for (let i = 0; i < 12; i++) {
            const res = await POST(createMockRequest({
                incidentId: `inc_rate_${i}`,
                ruta: '/products',
                timestamp: new Date().toISOString(),
                versionDespliegue: '1.0.0'
            }, clientIp));

            if (res.status === 429) {
                hitLimit = true;
                break;
            }
        }

        if (hitLimit) {
            console.log('💚 PASS: Rate limiting bloqueó la inundación de logs con éxito (HTTP 429).');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se activó el rate limiting después de exceder el límite.');
            failedCount++;
        }

    } catch (err: any) {
        console.error('Crash durante los tests:', err);
        failedCount++;
    }

    console.log(`\n🎉 Resumen de Pruebas de Client Errors: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

runClientErrorsTest().catch(e => {
    console.error('Fatal error en test:', e);
    process.exit(1);
});
