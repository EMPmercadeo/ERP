import {
  PACProvider,
  FacturaElectronicaDTO,
  PACEmisionResponse,
  PACAnulacionResponse,
  PACTransaction
} from '../pac-provider.interface';

export class GenericoPACProvider implements PACProvider {
  private credenciales: string;

  constructor(credencialesCifrada: string) {
    this.credenciales = credencialesCifrada;
  }

  async emitirFactura(payload: FacturaElectronicaDTO): Promise<PACEmisionResponse> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Validaciones simuladas básicas
    if (!payload.gEmis.ruc || !payload.gDatRec.ruc) {
      return {
        exitoso: false,
        codigoResultado: 'ERR-001',
        mensajeResultado: 'Datos de RUC del emisor o receptor incompletos.',
        error: 'RUC faltante.'
      };
    }

    if (payload.gItem.length === 0) {
      return {
        exitoso: false,
        codigoResultado: 'ERR-002',
        mensajeResultado: 'El documento debe contener al menos un ítem.',
        error: 'Sin ítems.'
      };
    }

    const uniqueId = Math.random().toString(36).substring(2, 10).toUpperCase();
    const cufe = `FACT-PAN-${payload.gEmis.ruc}-${uniqueId}`;
    const protocoloAutorizacion = `PROT-DGI-${Date.now()}`;
    const fechaAutorizacion = new Date();
    const qrContent = `https://dgi-fe.mef.gob.pa/consultas/factura?cufe=${cufe}&amb=${payload.iAmb}`;
    const xmlFirmado = `<?xml version="1.0" encoding="UTF-8"?><rFE><gEmis><dRuc>${payload.gEmis.ruc}</dRuc></gEmis><gDatRec><dRuc>${payload.gDatRec.ruc}</dRuc></gDatRec><cufe>${cufe}</cufe><protocolo>${protocoloAutorizacion}</protocolo></rFE>`;

    return {
      exitoso: true,
      cufe,
      protocoloAutorizacion,
      fechaAutorizacion,
      qrContent,
      xmlFirmado,
      codigoResultado: '00',
      mensajeResultado: 'Autorizado el uso de la FE.'
    };
  }

  async anularFactura(cufe: string, motivo: string): Promise<PACAnulacionResponse> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (!cufe) {
      return {
        exitoso: false,
        codigoResultado: 'ERR-010',
        mensajeResultado: 'CUFE requerido para anulación.',
        error: 'CUFE faltante.'
      };
    }

    if (!motivo || motivo.trim().length < 5) {
      return {
        exitoso: false,
        codigoResultado: 'ERR-011',
        mensajeResultado: 'El motivo de anulación debe tener al menos 5 caracteres.',
        error: 'Motivo inválido.'
      };
    }

    return {
      exitoso: true,
      fechaAnulacion: new Date(),
      codigoResultado: '00',
      mensajeResultado: 'Documento anulado con éxito en la DGI.'
    };
  }

  async consultarTransaccion(idOCufe: string): Promise<PACTransaction> {
    // Simular latencia de red
    await new Promise((resolve) => setTimeout(resolve, 200));

    return {
      cufe: idOCufe,
      estado: 'authorized',
      protocoloAutorizacion: `PROT-CONSULTA-${Date.now()}`,
      fechaAutorizacion: new Date(),
      codigoResultado: '00',
      mensajeResultado: 'Autorizado (Consulta exitosa).'
    };
  }
}
