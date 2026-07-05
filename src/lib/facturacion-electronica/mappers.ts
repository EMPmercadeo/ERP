import { FacturaElectronicaDTO } from './pac-provider.interface';

export function mapFacturaToDTO(params: {
  factura: any;
  cliente: any;
  empresa: any;
  sucursal: any;
  items: any[];
}): FacturaElectronicaDTO {
  const { factura, cliente, empresa, sucursal, items } = params;

  const ambiente = parseInt(empresa.ambienteDgi || '2'); // 1 = Prod, 2 = Pruebas

  const mappedItems = items.map((item) => {
    const cantidad = Number(item.cantidad);
    const precioUnitario = Number(item.precioUnitario);
    const descuento = Number(item.descuento || 0);
    const baseImponible = cantidad * precioUnitario - descuento;

    const tasa = item.codigoTasaItbms === '01' ? 0.07 :
                 item.codigoTasaItbms === '02' ? 0.10 :
                 item.codigoTasaItbms === '03' ? 0.15 : 0;
    
    const montoItbms = Number((baseImponible * tasa).toFixed(4));
    const montoTotal = Number((baseImponible + montoItbms).toFixed(4));

    return {
      productoId: item.productoId || null,
      descripcion: item.descripcion,
      cantidad,
      precioUnitario,
      descuento,
      codigoTasaItbms: item.codigoTasaItbms || '00',
      montoItbms,
      montoTotal
    };
  });

  const subtotal = items.reduce((sum, item) => sum + (Number(item.cantidad) * Number(item.precioUnitario)), 0);
  const totalDescuento = items.reduce((sum, item) => sum + Number(item.descuento || 0), 0);
  const totalItbms = mappedItems.reduce((sum, item) => sum + item.montoItbms, 0);
  const totalNeto = Number((subtotal - totalDescuento + totalItbms).toFixed(2));

  // Determine payment terms
  const tipoPago = (factura.condicionPago || 'contado').toLowerCase() === 'credito' ? 'credito' : 'contado';

  // Map DTO
  const dto: FacturaElectronicaDTO = {
    iAmb: ambiente,
    dFechaEm: (factura.fechaEmision || new Date()).toISOString(),
    gEmis: {
      ruc: empresa.ruc,
      dv: empresa.dv,
      razonSocial: empresa.razonSocial,
      nombreComercial: empresa.nombreComercial || null,
      direccion: sucursal.direccion || empresa.direccion || 'Panamá',
      telefono: empresa.telefono || null,
      email: empresa.email || null
    },
    gDatRec: {
      tipoRuc: cliente.tipoRuc || 'RUC_NATURAL',
      ruc: cliente.ruc,
      dv: cliente.dv || null,
      razonSocial: cliente.razonSocial,
      direccion: cliente.direccion || null,
      email: cliente.email || null,
      telefono: cliente.telefono || null
    },
    gItem: mappedItems,
    gTot: {
      dTotNeto: Number((subtotal - totalDescuento).toFixed(2)),
      dTotITBMS: Number(totalItbms.toFixed(2)),
      dVTot: totalNeto,
      gFormaPago: {
        tipoPago,
        metodoPago: factura.metodoPago || 'efectivo'
      }
    }
  };

  // If this is a credit note (NC), map reference info
  if (factura.tipoDocumento === 'NC' && factura.facturaOrigen) {
    dto.gDFRef = {
      cufeDocRef: factura.facturaOrigen.cufe || null,
      fechaDocRef: factura.facturaOrigen.fechaEmision ? factura.facturaOrigen.fechaEmision.toISOString() : null
    };
  }

  return dto;
}
