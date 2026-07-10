import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/context';
import { renderHtmlToPdf } from '@/lib/pdf/browser';
import { buildInvoicePdfHtml } from '@/lib/pdf/invoice-template';

// Antes NO existía este endpoint — el botón "PDF"/"Descargar PDF" en toda la app (Dashboard,
// listado de facturas, detalle de factura) apuntaba a /api/invoices/[id]/pdf o simplemente
// abría el diálogo de impresión del navegador (?print=true), nunca un PDF real con la marca
// de la empresa. Este endpoint genera un PDF de verdad, con los datos reales de la empresa
// emisora y del cliente, y refleja honestamente el estado DGI del documento (nunca muestra
// un CUFE/QR salvo que la factura de verdad haya sido aceptada por la DGI).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    let empresaId: string;
    try {
      ({ empresaId } = await getTenantContext());
    } catch {
      return NextResponse.json({ error: 'Debes iniciar sesión para descargar esta factura.' }, { status: 401 });
    }

    const { id } = await params;

    const factura = await prisma.factura.findFirst({
      where: {
        empresaId,
        OR: [{ id }, { numeroCompleto: id }]
      },
      include: {
        empresa: true,
        cliente: true,
        sucursal: true,
        creador: true,
        items: { orderBy: { id: 'asc' } }
      }
    });

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada o no pertenece a tu empresa.' }, { status: 404 });
    }

    const html = await buildInvoicePdfHtml(
      {
        razonSocial: factura.empresa.razonSocial,
        nombreComercial: factura.empresa.nombreComercial,
        ruc: factura.empresa.ruc,
        dv: factura.empresa.dv,
        direccion: factura.empresa.direccion,
        telefono: factura.empresa.telefono,
        email: factura.empresa.email,
        logo: factura.empresa.logo,
      },
      {
        razonSocial: factura.cliente.razonSocial,
        ruc: factura.cliente.ruc,
        dv: factura.cliente.dv,
        direccion: factura.cliente.direccion,
        email: factura.cliente.email,
        telefono: factura.cliente.telefono,
        condicionPago: factura.cliente.condicionPago,
      },
      {
        numeroCompleto: factura.numeroCompleto,
        tipoDocumento: factura.tipoDocumento,
        fechaEmision: factura.fechaEmision,
        fechaVencimiento: factura.fechaVencimiento,
        subtotal: factura.subtotal,
        totalDescuento: factura.totalDescuento,
        totalItbms: factura.totalItbms,
        totalNeto: factura.totalNeto,
        totalPagado: factura.totalPagado,
        saldoPendiente: factura.saldoPendiente,
        estadoDgi: factura.estadoDgi,
        cufe: factura.cufe,
        qrContent: factura.qrContent,
        protocoloAutorizacion: factura.protocoloAutorizacion,
        fechaAutorizacionDGI: factura.fechaAutorizacionDGI,
        errorDgi: factura.errorDgi,
        motivoAnulacionDGI: factura.motivoAnulacionDGI,
        sucursalNombre: factura.sucursal?.nombre,
        creadorNombre: factura.creador?.nombre,
        items: factura.items.map(item => ({
          descripcion: item.descripcion,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          descuento: item.descuento,
          codigoTasaItbms: item.codigoTasaItbms,
          montoItbms: item.montoItbms,
          montoTotal: item.montoTotal,
        })),
      }
    );

    const pdfBuffer = await renderHtmlToPdf(html);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${factura.numeroCompleto.replace(/[^\w.-]+/g, '_')}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('Error GET /api/invoices/[id]/pdf:', error);
    return NextResponse.json({ error: 'Error al generar el PDF de la factura.' }, { status: 500 });
  }
}
