// Mock next/cache globally to avoid Invariant errors in command line scripts
const nextCache = require('next/cache');
nextCache.revalidatePath = () => {};

import { prisma } from '../src/lib/db';
import { createPurchase, deletePurchase } from '../src/lib/actions/purchases';
import { createCreditNote } from '../src/lib/actions/credit-notes';
import { createDeliveryNote } from '../src/lib/actions/delivery-notes';
import { crearPlanCuentasParaEmpresa } from '../src/lib/contabilidad/planCuentasDefault';

async function runRegressionTests() {
    console.log('🚀 Iniciando pruebas de regresión automatizadas de Compras, Notas de Crédito y Despachos...');
    let passedCount = 0;
    let failedCount = 0;

    // 1. Obtener empresas de prueba
    let empresaA = await prisma.empresa.findFirst({ where: { ruc: 'TEST-EMP-A' } });
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
    const idEmpresaA = empresaA.id;

    // Crear plan de cuentas para Empresa A si no tiene
    const planCuentasCount = await prisma.planCuentas.count({ where: { empresaId: idEmpresaA } });
    if (planCuentasCount === 0) {
        console.log('📊 Generando plan de cuentas contables de prueba para Empresa A...');
        await crearPlanCuentasParaEmpresa(prisma, idEmpresaA);
    }

    // Obtener sucursal and caja reales de Empresa A
    let sucursal = await prisma.sucursal.findFirst({ where: { empresaId: idEmpresaA } });
    if (!sucursal) {
        sucursal = await prisma.sucursal.create({
            data: {
                empresaId: idEmpresaA,
                codigo: '001',
                nombre: 'Sucursal Test A',
                direccion: 'Panama'
            }
        });
    }

    let caja = await prisma.caja.findFirst({ where: { sucursalId: sucursal.id } });
    if (!caja) {
        caja = await prisma.caja.create({
            data: {
                sucursal: { connect: { id: sucursal.id } },
                empresa: { connect: { id: idEmpresaA } },
                codigo: '001',
                nombre: 'Caja Test A'
            }
        });
    }

    // Crear bodega por defecto para Empresa A si no existe
    let bodega = await prisma.bodega.findFirst({ where: { empresaId: idEmpresaA } });
    if (!bodega) {
        bodega = await prisma.bodega.create({
            data: {
                empresa: { connect: { id: idEmpresaA } },
                sucursal: { connect: { id: sucursal.id } },
                nombre: 'Bodega Principal Test',
                codigo: 'B-PRIN',
                activa: true
            }
        });
    }

    // Obtener o crear un usuario real en Postgres
    let user = await prisma.usuario.findFirst({ where: { empresaId: idEmpresaA } });
    if (!user) {
        user = await prisma.usuario.create({
            data: {
                empresaId: idEmpresaA,
                email: 'admin-regression@test.com',
                nombre: 'Test Admin',
                rol: 'admin',
                passwordHash: 'pass'
            }
        });
    }
    const testUserId = user.id;

    const uniqueId = String(Date.now());

    // Limpiar de forma segura todas las transacciones previas asociadas a Empresa A para evitar colisiones
    await prisma.compraItem.deleteMany({ where: { compra: { empresaId: idEmpresaA } } }).catch(() => {});
    await prisma.compra.deleteMany({ where: { empresaId: idEmpresaA } }).catch(() => {});
    await prisma.facturaItem.deleteMany({ where: { factura: { empresaId: idEmpresaA } } }).catch(() => {});
    await prisma.factura.deleteMany({ where: { empresaId: idEmpresaA } }).catch(() => {});
    
    // Limpieza global de Albaranes/Despachos para evitar violaciones de unicidad de folio (numero)
    await prisma.albaranVentaItem.deleteMany({ where: { albaran: { numero: { startsWith: 'ALB-' } } } }).catch(() => {});
    await prisma.albaranVenta.deleteMany({ where: { numero: { startsWith: 'ALB-' } } }).catch(() => {});
    await prisma.secuencia.deleteMany({ where: { tipoDocumento: 'ALB' } }).catch(() => {});

    // Ahora eliminar catálogos
    await prisma.proveedor.deleteMany({ where: { empresaId: idEmpresaA } }).catch(() => {});
    await prisma.inventarioBodega.deleteMany({ where: { bodega: { empresaId: idEmpresaA } } }).catch(() => {});
    await prisma.producto.deleteMany({ where: { empresaId: idEmpresaA } }).catch(() => {});
    await prisma.cliente.deleteMany({ where: { empresaId: idEmpresaA } }).catch(() => {});

    // Crear proveedor de prueba
    const proveedor = await prisma.proveedor.create({
        data: {
            empresaId: idEmpresaA,
            tipoRuc: 'juridico',
            ruc: `REG-PROV-${uniqueId}`,
            dv: '88',
            razonSocial: 'Proveedor de Regresión',
            condicionPago: 'Contado'
        }
    });

    // Crear producto de prueba (inventariable)
    const producto = await prisma.producto.create({
        data: {
            empresaId: idEmpresaA,
            codigoInterno: `REG-PROD-${uniqueId}`,
            descripcion: 'Producto de Regresión',
            precioVenta: 100.00,
            costoUnitario: 50.00,
            codigoTasaItbms: '01',
            stockActual: 10,
            unidadMedida: 'UND' // No es SRV, por lo que afecta inventario
        }
    });

    // Crear cliente de prueba
    const cliente = await prisma.cliente.create({
        data: {
            empresaId: idEmpresaA,
            tipoRuc: 'natural',
            ruc: `REG-CLI-${uniqueId}`,
            dv: '00',
            razonSocial: 'Cliente de Regresión'
        }
    });

    // Mock session context with admin role for full permissions
    (global as any).__mockTenantContext = {
        empresaId: idEmpresaA,
        userId: testUserId,
        role: 'admin',
        emailVerified: true
    };

    try {
        // --- 1. REGRESIÓN DE COMPRAS ---
        console.log('\n🔍 1. Compras: Creación de Factura de Compra e impacto en stock/saldos...');
        
        const formData = new FormData();
        formData.append('proveedorId', proveedor.id);
        formData.append('numeroFactura', `FC-REG-${uniqueId}`);
        formData.append('fechaEmision', new Date().toISOString().split('T')[0]);
        formData.append('fechaVencimiento', new Date().toISOString().split('T')[0]);
        formData.append('condicionPago', 'Credito');
        formData.append('items', JSON.stringify([
            {
                productoId: producto.id,
                descripcion: producto.descripcion,
                cantidad: 5,
                costoUnitario: 50.00, // Debe ser costoUnitario, no precioUnitario
                descuento: 0,
                codigoTasaItbms: '01'
            }
        ]));

        let resCreate;
        try {
            resCreate = await createPurchase({}, formData);
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT') && e.digest?.includes('purchases')) {
                resCreate = { success: true };
            } else {
                throw e;
            }
        }
        
        if (resCreate && resCreate.message) {
            console.error('Error retornado por createPurchase:', resCreate);
        }

        // Verificar stock de producto incrementado (10 + 5 = 15)
        const updatedProd = await prisma.producto.findUnique({ where: { id: producto.id } });
        // Verificar saldo del proveedor incrementado ($250 + ITBMS 7% = $267.50)
        const updatedProv = await prisma.proveedor.findUnique({ where: { id: proveedor.id } });

        const stockOk = updatedProd?.stockActual === 15;
        const balanceOk = Number(updatedProv?.saldoPendiente) === 267.50;

        if (stockOk && balanceOk) {
            console.log('💚 PASS: Factura de compra creada exitosamente. Stock y saldo incrementados.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Falló el impacto de compra en stock o saldos.', { stock: updatedProd?.stockActual, saldo: updatedProv?.saldoPendiente });
            failedCount++;
        }

        // --- 2. REGRESIÓN DE BORRADO DE COMPRA ---
        console.log('\n🔍 2. Compras: Reversión de stock/saldos al eliminar compra...');
        const compra = await prisma.compra.findFirst({ where: { numeroFactura: `FC-REG-${uniqueId}`, empresaId: idEmpresaA } });
        if (compra) {
            let resDelete;
            try {
                resDelete = await deletePurchase(compra.id);
            } catch (e: any) {
                if (e.digest?.includes('NEXT_REDIRECT')) {
                    resDelete = { success: true };
                } else {
                    resDelete = { success: false, error: e.message };
                }
            }

            if (resDelete.success) {
                const revertedProd = await prisma.producto.findUnique({ where: { id: producto.id } });
                const revertedProv = await prisma.proveedor.findUnique({ where: { id: proveedor.id } });

                const stockReverted = revertedProd?.stockActual === 10;
                const balanceReverted = Number(revertedProv?.saldoPendiente) === 0;

                if (stockReverted && balanceReverted) {
                    console.log('💚 PASS: Factura de compra eliminada exitosamente. Stock y saldo revertidos.');
                    passedCount++;
                } else {
                    console.error('❌ FAIL: Falló la reversión de stock/saldo al eliminar compra.', { stock: revertedProd?.stockActual, saldo: revertedProv?.saldoPendiente });
                    failedCount++;
                }
            } else {
                console.error('❌ FAIL: Error al ejecutar deletePurchase:', resDelete);
                failedCount++;
            }
        } else {
            console.error('❌ FAIL: No se encontró la factura de compra creada para test de borrado.');
            failedCount++;
        }

        // --- 3. REGRESIÓN DE NOTAS DE CRÉDITO ---
        console.log('\n🔍 3. Notas de Crédito: Anulación total de factura origen...');
        
        // Crear factura original de prueba
        const facturaOrigen = await prisma.factura.create({
            data: {
                empresaId: idEmpresaA,
                sucursalId: sucursal.id,
                cajaId: caja.id,
                clienteId: cliente.id,
                creadorId: testUserId,
                tipoDocumento: '01', // Factura de venta
                numeroSecuencial: 9999,
                numeroCompleto: `FE-001-001-01-${uniqueId.substring(uniqueId.length - 8)}`,
                fechaEmision: new Date(),
                subtotal: 100,
                totalDescuento: 0,
                totalItbms: 7,
                totalNeto: 107,
                saldoPendiente: 107,
                estadoDgi: 'aceptada'
            }
        });

        const formDataNC = new FormData();
        formDataNC.append('facturaOrigenId', facturaOrigen.id);
        formDataNC.append('clienteId', cliente.id);
        formDataNC.append('motivoDgi', '01 - Anulación total de la operación');
        formDataNC.append('items', JSON.stringify([
            {
                productoId: producto.id,
                descripcion: 'Devolución de producto',
                cantidad: 1,
                precioUnitario: 100.00,
                descuento: 0,
                codigoTasaItbms: '01'
            }
        ]));

        try {
            // createCreditNote llama a redirect() al final. Capturamos la redirección como éxito
            await createCreditNote({}, formDataNC);
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT')) {
                // Redirección exitosa
            } else {
                throw e;
            }
        }

        // Verificar que la factura origen quedó en estado "anulada" y con saldoPendiente 0
        const checkedOrigen = await prisma.factura.findUnique({ where: { id: facturaOrigen.id } });
        if (checkedOrigen?.estadoDgi === 'anulada' && Number(checkedOrigen.saldoPendiente) === 0) {
            console.log('💚 PASS: Nota de crédito creada. Factura original anulada y saldo puesto a 0.');
            passedCount++;
        } else {
            console.error('❌ FAIL: Factura original no fue anulada correctamente.', { estado: checkedOrigen?.estadoDgi, saldo: checkedOrigen?.saldoPendiente });
            failedCount++;
        }

        // Limpiar factura original y nota de crédito generada
        await prisma.facturaItem.deleteMany({
            where: { productoId: producto.id }
        });
        await prisma.factura.deleteMany({
            where: { empresaId: idEmpresaA, clienteId: cliente.id }
        });

        // --- 4. REGRESIÓN DE DESPACHOS ---
        console.log('\n🔍 4. Despachos: Creación de Albarán / Delivery Note...');
        const formDataDN = new FormData();
        formDataDN.append('clienteId', cliente.id);
        formDataDN.append('direccionEntrega', 'Calle Principal 123');
        formDataDN.append('items', JSON.stringify([
            {
                productoId: producto.id,
                descripcion: producto.descripcion,
                cantidadPedida: 2,
                cantidadEntregada: 2,
                cantidadPendiente: 0,
                precioUnitario: 100.00,
                descuento: 0,
                codigoTasaItbms: '01'
            }
        ]));

        let resDN;
        try {
            resDN = await createDeliveryNote({}, formDataDN);
        } catch (e: any) {
            if (e.digest?.includes('NEXT_REDIRECT')) {
                resDN = { success: true };
            } else {
                resDN = { success: false, error: e.message };
            }
        }
        
        if (resDN && !resDN.success) {
            console.error('Error retornado por createDeliveryNote:', resDN);
        }

        const deliveryNote = await prisma.albaranVenta.findFirst({ where: { clienteId: cliente.id, empresaId: idEmpresaA } });

        if (deliveryNote) {
            console.log('💚 PASS: Despacho / Albarán creado correctamente en la base de datos.');
            passedCount++;
        } else {
            console.error('❌ FAIL: No se pudo verificar la creación del despacho.');
            failedCount++;
        }

        // Limpiar despacho
        if (deliveryNote) {
            await prisma.albaranVentaItem.deleteMany({ where: { albaranId: deliveryNote.id } });
            await prisma.albaranVenta.delete({ where: { id: deliveryNote.id } });
        }

    } finally {
        // Limpiar facturas y compras para evitar FK violations
        await prisma.compraItem.deleteMany({ where: { productoId: producto.id } }).catch(() => {});
        await prisma.compra.deleteMany({ where: { proveedorId: proveedor.id } }).catch(() => {});
        await prisma.facturaItem.deleteMany({ where: { productoId: producto.id } }).catch(() => {});
        await prisma.factura.deleteMany({ where: { clienteId: cliente.id } }).catch(() => {});
        await prisma.inventarioBodega.deleteMany({ where: { productoId: producto.id } }).catch(() => {});

        // Limpieza final de registros de regresión
        await prisma.proveedor.delete({ where: { id: proveedor.id } }).catch(() => {});
        await prisma.producto.delete({ where: { id: producto.id } }).catch(() => {});
        await prisma.cliente.delete({ where: { id: cliente.id } }).catch(() => {});
        (global as any).__mockTenantContext = null;
        console.log('\n🧹 Limpieza de registros de regresión completada.');
    }

    console.log(`\n🎉 Resumen de Pruebas de Regresión: ${passedCount} PASSED, ${failedCount} FAILED.`);
    if (failedCount > 0) {
        process.exit(1);
    }
}

runRegressionTests().catch(e => {
    console.error('Fatal regression test error:', e);
    process.exit(1);
});
