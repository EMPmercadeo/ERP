import { prisma } from '../src/lib/db';

async function main() {
    console.log('Iniciando script de backfill para InventarioBodega...');

    // 1. Obtener todas las empresas con sus sucursales, bodegas y productos
    const empresas = await prisma.empresa.findMany({
        include: {
            sucursales: {
                include: {
                    bodegas: true
                }
            },
            productos: true
        }
    });

    console.log(`Encontradas ${empresas.length} empresas para procesar.`);

    console.log('\n================ PROCESANDO INVENTARIOS POR EMPRESA ================');
    for (const empresa of empresas) {
        // Encontrar la bodega de destino (debe ser la Bodega Principal '001' de la primera sucursal)
        // Buscamos primero en la primera sucursal, y si no en cualquiera de sus sucursales
        let targetBodega = null;
        
        if (empresa.sucursales.length > 0) {
            // Intentar buscar la bodega '001' de la primera sucursal
            const primeraSucursal = empresa.sucursales[0];
            targetBodega = primeraSucursal.bodegas.find(b => b.codigo === '001') || primeraSucursal.bodegas[0];
            
            // Si la primera sucursal no tiene bodega, buscar en cualquier otra sucursal
            if (!targetBodega) {
                for (const sucursal of empresa.sucursales) {
                    if (sucursal.bodegas.length > 0) {
                        targetBodega = sucursal.bodegas.find(b => b.codigo === '001') || sucursal.bodegas[0];
                        break;
                    }
                }
            }
        }

        if (!targetBodega) {
            console.error(`❌ Empresa: "${empresa.razonSocial}" (ID: ${empresa.id}) no tiene ninguna sucursal con bodega. ¡Omita esta empresa! Corra primero el backfill de bodegas.`);
            continue;
        }

        console.log(`Empresa: "${empresa.razonSocial}" (ID: ${empresa.id})`);
        console.log(`  Target Bodega: "${targetBodega.nombre}" (Código: ${targetBodega.codigo}, ID: ${targetBodega.id})`);

        let poblados = 0;
        const omitidos = 0;

        for (const producto of empresa.productos) {
            try {
                // Upsert para verificar si ya existe el registro InventarioBodega para esta bodega y producto.
                // Si existe, no modificamos nada (update: {}). Si no existe, lo creamos.
                const inventario = await prisma.inventarioBodega.upsert({
                    where: {
                        bodegaId_productoId: {
                            bodegaId: targetBodega.id,
                            productoId: producto.id
                        }
                    },
                    update: {},
                    create: {
                        empresaId: empresa.id,
                        bodegaId: targetBodega.id,
                        productoId: producto.id,
                        cantidad: producto.stockActual
                    }
                });

                // Si el updatedAt es el mismo que createdAt (o si podemos detectar si se creó), pero en upsert 
                // podemos simplemente comprobar si ya existía buscando primero, o asumiendo el resultado.
                // Como queremos contar los insertados, vamos a verificar si existía antes del upsert.
                poblados++;
            } catch (error) {
                console.error(`  ❌ Error al procesar producto "${producto.descripcion}" (ID: ${producto.id}):`, error);
            }
        }

        console.log(`  ✓ Productos procesados: ${poblados} (actualizados o creados)`);
    }
    console.log('=====================================================================');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
