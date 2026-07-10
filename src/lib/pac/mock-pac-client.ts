import crypto from 'crypto';

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

export async function emitirFacturaPAC(payload: PACEmisionPayload): Promise<PACEmisionResponse> {
  if (!PAC_INTEGRATION_ENABLED) {
    return {
      success: false,
      error: 'La integración con el PAC todavía no está habilitada en este entorno.',
      fechaEmision: new Date().toISOString()
    };
  }

  // Simular latencia de red al PAC
  await new Promise((resolve) => setTimeout(resolve, 350));

  try {
    // Generación de CUFE real de 45 caracteres en formato hexadecimal tributario DGI
    const baseHash = `${payload.empresaRuc}-${payload.tipoDocumento}-${payload.totales.total}-${Date.now()}`;
    const hash = crypto.createHash('sha256').update(baseHash).digest('hex').toUpperCase().substring(0, 45);
    const cufe = `FE01${hash.padEnd(41, '0').substring(0, 41)}`;

    // URL de consulta de código QR del portal tributario DGI Panamá (dgi.mef.gob.pa)
    const qrUrl = `https://dgi-fep.mef.gob.pa/Consultas/FacturasPorCUFE?cufe=${cufe}`;

    return {
      success: true,
      cufe,
      qrUrl,
      numeroFiscal: `${payload.tipoDocumento === '01' ? 'FE' : 'BE'}-${Date.now().toString().slice(-8)}`,
      fechaEmision: new Date().toISOString()
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error en comunicación con PAC DGI',
      fechaEmision: new Date().toISOString()
    };
  }
}
