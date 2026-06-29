import { prisma } from '../src/lib/db';

async function main() {
    console.log('🔒 Habilitando Row Level Security (RLS) en todas las tablas de Supabase...');

    const tables = [
        'Empresa',
        'Sucursal',
        'Caja',
        'Secuencia',
        'Usuario',
        'Cliente',
        'Producto',
        'Factura',
        'FacturaItem',
        'Pago',
        'Auditoria',
        'Cotizacion',
        'CotizacionItem',
        'Plan',
        'Subscription',
        'DocumentUsage',
        'PosIntegration',
        'PosSyncLog',
        'ProductImage'
    ];

    for (const table of tables) {
        try {
            console.log(`Applying RLS to table: ${table}...`);
            await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ENABLE ROW LEVEL SECURITY;`);
            console.log(`✅ RLS habilitado en "${table}"`);
        } catch (error: any) {
            console.error(`❌ Error al habilitar RLS en "${table}":`, error.message || error);
        }
    }

    console.log('🎉 ¡Todas las tablas han sido protegidas exitosamente con RLS!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
