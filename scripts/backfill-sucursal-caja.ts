import { prisma } from '../src/lib/db';

async function main() {
    console.log('Iniciando script de backfill para Sucursal y Caja...');

    // 1. Buscar todas las Empresa que NO tengan ninguna Sucursal
    const empresasSinSucursal = await prisma.empresa.findMany({
        where: {
            sucursales: {
                none: {}
            }
        }
    });

    console.log(`Encontradas ${empresasSinSucursal.length} empresas sin sucursal.`);

    const corregidas: { ruc: string; razonSocial: string }[] = [];

    // 2. Para cada una encontrada, crear Sucursal y Caja por defecto en una transacción
    for (const empresa of empresasSinSucursal) {
        try {
            await prisma.$transaction(async (tx) => {
                // Crear Sucursal Casa Matriz
                const nuevaSucursal = await tx.sucursal.create({
                    data: {
                        empresaId: empresa.id,
                        codigo: '001',
                        nombre: 'Casa Matriz',
                        direccion: empresa.direccion || 'Panamá',
                        activa: true,
                    }
                });

                // Crear Caja Principal
                await tx.caja.create({
                    data: {
                        empresaId: empresa.id,
                        sucursalId: nuevaSucursal.id,
                        codigo: '001',
                        nombre: 'Caja Principal',
                        activa: true,
                    }
                });
            });

            corregidas.push({
                ruc: empresa.ruc,
                razonSocial: empresa.razonSocial
            });
            console.log(`Corregida empresa: ${empresa.razonSocial} (RUC: ${empresa.ruc})`);
        } catch (error) {
            console.error(`Error al corregir empresa ${empresa.razonSocial} (ID: ${empresa.id}):`, error);
        }
    }

    // 3. Imprimir el resumen
    console.log('\n================ RESUMEN DEL BACKFILL ================');
    console.log(`Total de empresas corregidas: ${corregidas.length}`);
    if (corregidas.length > 0) {
        console.log('Listado de empresas corregidas:');
        corregidas.forEach((c, index) => {
            console.log(`${index + 1}. Razón Social: ${c.razonSocial} | RUC: ${c.ruc}`);
        });
    }
    console.log('======================================================');
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
