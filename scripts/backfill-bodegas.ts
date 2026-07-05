import { prisma } from '../src/lib/db';

async function main() {
    console.log('Iniciando script de backfill para Bodega...');

    // 1. Buscar todas las Sucursal que NO tengan ninguna Bodega
    const sucursalesSinBodega = await prisma.sucursal.findMany({
        where: {
            bodegas: {
                none: {}
            }
        },
        include: {
            empresa: true
        }
    });

    console.log(`Encontradas ${sucursalesSinBodega.length} sucursales sin bodega.`);

    let corregidas = 0;

    // 2. Para cada una, crear la Bodega Principal
    for (const sucursal of sucursalesSinBodega) {
        try {
            await prisma.bodega.create({
                data: {
                    empresaId: sucursal.empresaId,
                    sucursalId: sucursal.id,
                    codigo: '001',
                    nombre: 'Bodega Principal',
                    activa: true
                }
            });
            corregidas++;
            console.log(`Sucursal corregida: ${sucursal.nombre} (Empresa: ${sucursal.empresa.razonSocial}, ID: ${sucursal.id})`);
        } catch (error) {
            console.error(`Error al crear bodega para sucursal ${sucursal.nombre} (ID: ${sucursal.id}):`, error);
        }
    }

    console.log('\n================ RESUMEN DEL BACKFILL DE BODEGAS ================');
    console.log(`Total de sucursales corregidas: ${corregidas}`);
    console.log('==================================================================');
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
