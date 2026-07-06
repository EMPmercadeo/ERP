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

  async emitirFactura(_payload: FacturaElectronicaDTO): Promise<PACEmisionResponse> {
    throw new Error('Integración con PAC no implementada. Esta empresa no puede emitir facturas electrónicas todavía.');
  }

  async anularFactura(_cufe: string, _motivo: string): Promise<PACAnulacionResponse> {
    throw new Error('Integración con PAC no implementada. Esta empresa no puede emitir facturas electrónicas todavía.');
  }

  async consultarTransaccion(_idOCufe: string): Promise<PACTransaction> {
    throw new Error('Integración con PAC no implementada. Esta empresa no puede emitir facturas electrónicas todavía.');
  }
}
