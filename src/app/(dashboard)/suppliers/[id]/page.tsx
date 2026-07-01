import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import { SupplierDetailClient } from '@/components/suppliers/SupplierDetailClient';

export const dynamic = 'force-dynamic';

export default async function SupplierDetailPage(props: { params: Promise<{ id: string }>, searchParams: Promise<{ tab?: string }> }) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { id } = params;
    const initialTab = searchParams.tab || 'info';
    const { empresaId } = await getTenantContext();

    // 1. Fetch Supplier
    const supplier = await prisma.proveedor.findFirst({
        where: { id, empresaId },
        include: {
            compras: {
                orderBy: { fechaEmision: 'desc' },
            },
            pagos: {
                orderBy: { fechaPago: 'desc' }
            }
        }
    });

    if (!supplier) {
        notFound();
    }

    // 2. Format supplier details
    const formattedSupplier = {
        id: supplier.id,
        tipoRuc: supplier.tipoRuc,
        ruc: supplier.ruc,
        dv: supplier.dv || '',
        razonSocial: supplier.razonSocial,
        nombreComercial: supplier.nombreComercial || '',
        nombreContacto: supplier.nombreContacto || '',
        direccion: supplier.direccion || '',
        email: supplier.email || '',
        telefono: supplier.telefono || '',
        saldoPendiente: supplier.saldoPendiente.toNumber(),
        limiteCredito: supplier.limiteCredito ? supplier.limiteCredito.toNumber() : null,
        observaciones: supplier.observaciones || '',
        condicionPago: supplier.condicionPago,
        estado: supplier.estado,
        createdAt: supplier.createdAt.toISOString()
    };

    // 3. Format purchase invoices list
    const formattedPurchases = supplier.compras.map(c => ({
        id: c.id,
        numeroFactura: c.numeroFactura,
        fechaEmision: c.fechaEmision.toISOString(),
        fechaVencimiento: c.fechaVencimiento.toISOString(),
        totalNeto: c.totalNeto.toNumber(),
        saldoPendiente: c.saldoPendiente.toNumber(),
        estadoPago: c.estadoPago
    }));

    // 4. Format payments list
    const formattedPayments = supplier.pagos.map(p => ({
        id: p.id,
        compraId: p.compraId,
        fechaPago: p.fechaPago.toISOString(),
        monto: p.monto.toNumber(),
        metodoPago: p.metodoPago,
        referencia: p.referencia || ''
    }));

    return (
        <SupplierDetailClient 
            supplier={formattedSupplier} 
            purchases={formattedPurchases} 
            payments={formattedPayments}
            initialTab={initialTab}
        />
    );
}
