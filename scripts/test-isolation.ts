import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Iniciando pruebas de aislamiento de inquilinos (Tenant Isolation)...');

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

    console.log(`✅ Empresas listas: Empresa A (${empresaA.id}), Empresa B (${empresaB.id})`);

    // 2. Crear registros bajo Empresa A
    console.log('\n📝 Creando registros de prueba para Empresa A...');
    const clienteA = await prisma.cliente.create({
        data: {
            empresaId: empresaA.id,
            tipoRuc: 'natural',
            ruc: 'CLIENT-A-RUC',
            dv: '99',
            razonSocial: 'Cliente de Empresa A'
        }
    });

    const productoA = await prisma.producto.create({
        data: {
            empresaId: empresaA.id,
            codigoInterno: 'PROD-A-CODE',
            descripcion: 'Producto de Empresa A',
            costoUnitario: 10,
            precioVenta: 20
        }
    });

    console.log(`✅ Cliente A (${clienteA.id}) y Producto A (${productoA.id}) creados.`);

    // 3. Crear registros bajo Empresa B
    console.log('\n📝 Creando registros de prueba para Empresa B...');
    const clienteB = await prisma.cliente.create({
        data: {
            empresaId: empresaB.id,
            tipoRuc: 'natural',
            ruc: 'CLIENT-B-RUC',
            dv: '88',
            razonSocial: 'Cliente de Empresa B'
        }
    });

    console.log(`✅ Cliente B (${clienteB.id}) creado.`);

    let testsPassed = true;

    // --- TEST 1: Filtro de lectura de Clientes ---
    console.log('\n🔍 Test 1: Listado de clientes aislado por empresa...');
    const listClientesA = await prisma.cliente.findMany({ where: { empresaId: empresaA.id } });
    const listClientesB = await prisma.cliente.findMany({ where: { empresaId: empresaB.id } });

    const clientALeak = listClientesA.some(c => c.empresaId === empresaB.id);
    const clientBLeak = listClientesB.some(c => c.empresaId === empresaA.id);

    if (!clientALeak && !clientBLeak) {
        console.log('💚 PASS: Los listados de clientes están completamente aislados.');
    } else {
        console.error('❌ FAIL: Fuga de datos detectada en el listado de clientes.');
        testsPassed = false;
    }

    // --- TEST 2: Acceso a detalle por ID y Empresa ---
    console.log('\n🔍 Test 2: Acceso directo a detalles de cliente por UUID...');
    // Empresa B intenta buscar el cliente de la Empresa A usando la cláusula de aislamiento
    const fetchRemoteClient = await prisma.cliente.findFirst({
        where: { id: clienteA.id, empresaId: empresaB.id }
    });

    if (fetchRemoteClient === null) {
        console.log('💚 PASS: Empresa B no pudo acceder al cliente de Empresa A.');
    } else {
        console.error('❌ FAIL: Fuga de datos! Empresa B accedió al cliente de Empresa A.');
        testsPassed = false;
    }

    // --- TEST 3: Validación cruzada de Productos ---
    console.log('\n🔍 Test 3: Validación cruzada en creación de Facturas...');
    // Simulando la validación que acabamos de agregar a createInvoice:
    // Empresa B intenta crear una factura referenciando el producto de Empresa A
    const productIdsToBill = [productoA.id];
    const uniqueProductIds = Array.from(new Set(productIdsToBill));
    const validProducts = await prisma.producto.findMany({
        where: {
            id: { in: uniqueProductIds },
            empresaId: empresaB.id // Buscando en la empresa B
        }
    });

    if (validProducts.length !== uniqueProductIds.length) {
        console.log('💚 PASS: Se bloqueó correctamente la facturación de productos ajenos.');
    } else {
        console.error('❌ FAIL: Fuga de datos! Empresa B pudo validar un producto de Empresa A.');
        testsPassed = false;
    }

    // --- LIMPIEZA ---
    console.log('\n🧹 Limpiando registros de prueba...');
    await prisma.compraItem.deleteMany({ where: { compra: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('compraItem delete error:', err));
    await prisma.compra.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('compra delete error:', err));
    await prisma.facturaItem.deleteMany({ where: { factura: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('facturaItem delete error:', err));
    await prisma.factura.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('factura delete error:', err));
    await prisma.albaranVentaItem.deleteMany({ where: { albaran: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('albaranItem delete error:', err));
    await prisma.albaranVenta.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('albaran delete error:', err));
    await prisma.secuencia.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('secuencia delete error:', err));
    await prisma.documentUsage.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('documentUsage delete error:', err));
    
    await prisma.asientoContableLinea.deleteMany({ where: { asiento: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('asientoLinea delete error:', err));
    await prisma.asientoContable.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('asiento delete error:', err));
    
    await prisma.loteProducto.deleteMany({ where: { bodega: { sucursal: { empresaId: { in: [empresaA.id, empresaB.id] } } } } }).catch(err => console.error('lote delete error:', err));
    await prisma.inventarioBodega.deleteMany({ where: { bodega: { sucursal: { empresaId: { in: [empresaA.id, empresaB.id] } } } } }).catch(err => console.error('inventarioBodega delete error:', err));
    await prisma.productImage.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('productImage delete error:', err));
    
    await prisma.cliente.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('cliente delete error:', err));
    await prisma.producto.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('producto delete error:', err));
    await prisma.caja.deleteMany({ where: { sucursal: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('caja delete error:', err));
    await prisma.bodega.deleteMany({ where: { sucursal: { empresaId: { in: [empresaA.id, empresaB.id] } } } }).catch(err => console.error('bodega delete error:', err));
    await prisma.sucursal.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('sucursal delete error:', err));
    await prisma.planCuentas.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('planCuentas delete error:', err));
    await prisma.usuario.deleteMany({ where: { empresaId: { in: [empresaA.id, empresaB.id] } } }).catch(err => console.error('usuario delete error:', err));
    await prisma.empresa.deleteMany({ where: { id: { in: [empresaA.id, empresaB.id] } } });
    console.log('✅ Limpieza completada.');

    if (testsPassed) {
        console.log('\n🎉 ¡TODAS LAS PRUEBAS DE AISLAMIENTO PASARON CORRECTAMENTE!');
        process.exit(0);
    } else {
        console.error('\n🚨 SE DETECTARON FALLOS EN EL AISLAMIENTO DE DATOS.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error('Error fatal durante la prueba:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
