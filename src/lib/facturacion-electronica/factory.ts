import { PACProvider } from './pac-provider.interface';
import { GenericoPACProvider } from './providers/generico.provider';
import { prisma } from '../db';

export async function getPACProviderForEmpresa(empresaId: string): Promise<PACProvider | null> {
  const config = await prisma.configuracionFacturacionElectronica.findUnique({
    where: { empresaId }
  });

  if (!config || !config.activo) {
    return null;
  }

  switch (config.proveedor.toUpperCase()) {
    case 'GENERICO':
      return new GenericoPACProvider(config.credencialCifrada);
    default:
      // Fallback a Genérico o lanzar error si no se soporta
      return new GenericoPACProvider(config.credencialCifrada);
  }
}
