export interface FacturaElectronicaDTO {
  iAmb: number; // 1 = producción, 2 = pruebas
  dFechaEm: string; // ISO date-time
  gEmis: {
    ruc: string;
    dv: string;
    razonSocial: string;
    nombreComercial?: string | null;
    direccion: string;
    telefono?: string | null;
    email?: string | null;
  };
  gDatRec: {
    tipoRuc: string;
    ruc: string;
    dv?: string | null;
    razonSocial: string;
    direccion?: string | null;
    email?: string | null;
    telefono?: string | null;
  };
  gItem: {
    productoId?: string | null;
    descripcion: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
    codigoTasaItbms: string;
    montoItbms: number;
    montoTotal: number;
  }[];
  gTot: {
    dTotNeto: number;
    dTotITBMS: number;
    dVTot: number;
    gFormaPago: {
      tipoPago: string; // contado | credito
      metodoPago?: string | null; // efectivo, tarjeta, banco, etc.
    };
  };
  gDFRef?: {
    cufeDocRef?: string | null;
    fechaDocRef?: string | null;
  } | null;
}

export interface PACEmisionResponse {
  exitoso: boolean;
  cufe?: string;
  protocoloAutorizacion?: string;
  fechaAutorizacion?: Date;
  qrContent?: string;
  xmlFirmado?: string;
  codigoResultado?: string;
  mensajeResultado?: string;
  error?: string;
}

export interface PACAnulacionResponse {
  exitoso: boolean;
  fechaAnulacion?: Date;
  codigoResultado?: string;
  mensajeResultado?: string;
  error?: string;
}

export interface PACTransaction {
  cufe: string;
  estado: string; // authorized | canceled | error
  protocoloAutorizacion?: string;
  fechaAutorizacion?: Date;
  codigoResultado?: string;
  mensajeResultado?: string;
}

export interface PACProvider {
  emitirFactura(payload: FacturaElectronicaDTO): Promise<PACEmisionResponse>;
  anularFactura(cufe: string, motivo: string): Promise<PACAnulacionResponse>;
  consultarTransaccion(idOCufe: string): Promise<PACTransaction>;
}
