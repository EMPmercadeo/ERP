// Mismo interruptor que src/lib/actions/billing-fe.ts. Antes este cliente SIEMPRE devolvía
// un CUFE falso (sha256 de los datos + timestamp) sin importar el entorno, y las rutas de POS
// (/api/pos/ventas y /api/pos/ventas/sync) lo trataban como una aceptación real de la DGI:
// marcaban la venta como AUTORIZADA, descontaban 1 cuota prepago y guardaban el CUFE inventado
// en FacturaEmitida — a diferencia del resto de la app (facturación normal), que sí respeta el
// kill-switch PAC_INTEGRATION_ENABLED y nunca fabrica datos fiscales. Se repite la comprobación
// AQUÍ ADENTRO (no solo en los call-sites) para que sea imposible generar un CUFE falso desde
// ninguna ruta mientras el interruptor esté apagado — las rutas de POS ya manejan
// `success: false` reencolando la venta sin consumir cuota, así que no hace falta tocarlas.
const PAC_INTEGRATION_ENABLED = process.env.PAC_INTEGRATION_ENABLED === 'true';

export interface PACEmisionPayload {
  empresaRuc: string;
  sucursal?: string;
  tipoDocumento: '01' | '02'; // 01 Factura | 02 Boleta
  cliente: {
    ruc: string;
    razonSocial: string;
    direccion?: string;
  };
  items: Array<{
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    tasaItbms: string; // '00' | '01' | '02' | '03'
  }>;
  totales: {
    subtotal: number;
    itbms: number;
    total: number;
  };
}

export interface PACEmisionResponse {
  success: boolean;
  cufe?: string;
  qrUrl?: string;
  numeroFiscal?: string;
  error?: string;
  fechaEmision: string;
}

// IMPORTANTE: esta función NUNCA debe fabricar un CUFE. Antes, cuando
// PAC_INTEGRATION_ENABLED=true, generaba un CUFE falso (sha256 + timestamp) con el
// formato real de la DGI y una URL real de dgi-fep.mef.gob.pa — es decir, en cuanto el
// dueño del proyecto active el interruptor al contratar un PAC real, el POS habría
// seguido timbrando facturas fiscales inventadas sin que nadie lo notara, mientras el
// resto de la app (facturación normal, vía GenericoPACProvider) sí falla honestamente.
// Ahora ambos caminos son consistentes: sin un proveedor PAC real implementado, esta
// función SIEMPRE responde `success: false` con un mensaje claro de "no conectado".
// Cuando se contrate un PAC real, implementa la llamada HTTP/SOAP real aquí (o mejor:
// haz que este archivo delegue en `getPACProviderForEmpresa()` de
// `src/lib/facturacion-electronica/factory.ts`, que es la misma fuente de verdad que ya
// usa la facturación normal, para no mantener dos integraciones PAC por separado).
export async function emitirFacturaPAC(_payload: PACEmisionPayload): Promise<PACEmisionResponse> {
  if (!PAC_INTEGRATION_ENABLED) {
    return {
      success: false,
      error: 'La integración con el PAC todavía no está habilitada en este entorno.',
      fechaEmision: new Date().toISOString()
    };
  }

  return {
    success: false,
    error: 'No hay un proveedor PAC real conectado todavía. Configura las credenciales del PAC en Configuración > Facturación Electrónica antes de timbrar ventas de POS.',
    fechaEmision: new Date().toISOString()
  };
}
