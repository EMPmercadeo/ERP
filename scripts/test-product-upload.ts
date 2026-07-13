// Must be first line — sets test environment before modules are evaluated
(process.env as any).NODE_ENV = 'test';

import { prisma } from '../src/lib/db';
import { uploadProductImage } from '../src/lib/actions/products';
import fs from 'fs/promises';
import path from 'path';

async function runTests() {
    console.log('🚀 Iniciando pruebas automatizadas de subida de imágenes de productos...');

    // 1. Obtener o crear dos empresas de prueba
    let empresaA = await prisma.empresa.findUnique({ where: { ruc: 'TEST-EMP-A' } });
    if (!empresaA) {
        empresaA = await prisma.empresa.create({
            data: {
                ruc: 'TEST-EMP-A',
                dv: '1',
                razonSocial: 'Empresa de Prueba A',
                direccion: 'Calle A, Panamá',
                planType: 'free'
            }
        });
    }

    let empresaB = await prisma.empresa.findUnique({ where: { ruc: 'TEST-EMP-B' } });
    if (!empresaB) {
        empresaB = await prisma.empresa.create({
            data: {
                ruc: 'TEST-EMP-B',
                dv: '2',
                razonSocial: 'Empresa de Prueba B',
                direccion: 'Calle B, Panamá',
                planType: 'free'
            }
        });
    }

    const idEmpresaA = empresaA.id;
    const idEmpresaB = empresaB.id;

    // Crear producto de prueba para Empresa A
    const productoA = await prisma.producto.create({
        data: {
            empresaId: idEmpresaA,
            codigoInterno: 'TEST-UPLOAD-A',
            descripcion: 'Producto Empresa A',
            precioVenta: 10.00,
            costoUnitario: 5.00,
            codigoTasaItbms: '01',
            stockActual: 10,
        }
    });

    try {
        // --- TEST 1: BOLA / IDOR ---
        console.log('\n🔍 TEST 1: Subida con Product ID de otro tenant...');
        // Simular sesión de Empresa B
        (global as any).__mockTenantContext = {
            empresaId: idEmpresaB,
            userId: 'test-user-b',
            role: 'admin',
            emailVerified: true
        };

        const formData1 = new FormData();
        const fakeFile = new File([Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])], 'test.png', { type: 'image/png' });
        formData1.append('file', fakeFile);

        const res1 = await uploadProductImage(productoA.id, formData1);
        if (!res1.success && res1.message?.includes('Producto no encontrado')) {
            console.log('💚 PASS: Subida rechazada correctamente por control BOLA.');
        } else {
            console.error('❌ FAIL: Se permitió la subida o dio un error inesperado:', res1);
        }

        // --- TEST 2: Magic Bytes (Contenido inválido con extensión válida) ---
        console.log('\n🔍 TEST 2: Archivo con extensión válida (.png) pero contenido inválido (texto)...');
        // Simular sesión de Empresa A
        (global as any).__mockTenantContext = {
            empresaId: idEmpresaA,
            userId: 'test-user-a',
            role: 'admin',
            emailVerified: true
        };

        const formData2 = new FormData();
        const badContentFile = new File([Buffer.from('console.log("malicious code");')], 'fake_image.png', { type: 'image/png' });
        formData2.append('file', badContentFile);

        const res2 = await uploadProductImage(productoA.id, formData2);
        if (!res2.success && res2.message?.includes('no es una imagen válida')) {
            console.log('💚 PASS: Archivo con contenido falso bloqueado por Magic Bytes.');
        } else {
            console.error('❌ FAIL: Se aceptó el archivo corrupto o dio otro error:', res2);
        }

        // --- TEST 3: Límite de tamaño (5MB) ---
        console.log('\n🔍 TEST 3: Archivo superior a 5 MB...');
        const formData3 = new FormData();
        const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
        // Poner bytes de PNG válidos al principio
        largeBuffer[0] = 0x89;
        largeBuffer[1] = 0x50;
        largeBuffer[2] = 0x4E;
        largeBuffer[3] = 0x47;
        const largeFile = new File([largeBuffer], 'too_large.png', { type: 'image/png' });
        formData3.append('file', largeFile);

        const res3 = await uploadProductImage(productoA.id, formData3);
        if (!res3.success && res3.message?.includes('excede el tamaño máximo')) {
            console.log('💚 PASS: Archivo superior a 5MB bloqueado correctamente.');
        } else {
            console.error('❌ FAIL: Se aceptó archivo sobredimensionado:', res3);
        }

        // --- TEST 4: Fallo de BD y Limpieza de Huérfanos ---
        console.log('\n🔍 TEST 4: Error de base de datos después de escribir el archivo y rollback de huérfanos...');
        // Mock prisma.$transaction para lanzar error
        const originalTransaction = prisma.$transaction;
        (prisma as any).$transaction = async () => {
            throw new Error('Database transaction mock failure for testing rollback.');
        };

        // Restablecer context válido para pasar el control BOLA
        (global as any).__mockTenantContext = {
            empresaId: idEmpresaA,
            userId: 'test-user-a',
            role: 'admin',
            emailVerified: true
        };

        const formData4 = new FormData();
        const validPngBuffer = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
        const testFilename = `test-rollback-${Date.now()}.png`;
        const testFile = new File([validPngBuffer], testFilename, { type: 'image/png' });
        formData4.append('file', testFile);

        let res4;
        try {
            res4 = await uploadProductImage(productoA.id, formData4);
        } catch (e) {
            res4 = { success: false, message: (e as Error).message };
        }

        // Restaurar prisma.$transaction
        (prisma as any).$transaction = originalTransaction;

        // Comprobar si el archivo físico fue eliminado
        const localUploadDir = path.join(process.cwd(), 'public', 'uploads', 'products');
        const files = await fs.readdir(localUploadDir).catch(() => []);
        const fileExists = files.some(f => f.includes(testFilename));

        if (!fileExists) {
            console.log('💚 PASS: Archivo temporal eliminado correctamente del disco al fallar la transacción.');
        } else {
            console.error('❌ FAIL: El archivo huérfano persistió en disco:', testFilename);
            // Limpieza manual por si acaso
            const filepath = path.join(localUploadDir, files.find(f => f.includes(testFilename)) || '');
            await fs.unlink(filepath).catch(() => {});
        }

    } finally {
        // Limpieza final del producto de prueba
        await prisma.producto.deleteMany({
            where: { id: productoA.id }
        });
        console.log('\n🧹 Limpieza de registros de prueba completada.');
    }
}

runTests().catch((e) => {
    console.error('Error fatal durante la ejecución de las pruebas:', e);
});
