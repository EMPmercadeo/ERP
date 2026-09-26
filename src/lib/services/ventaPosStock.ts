import { prisma } from '@/lib/db';
import { cargarRecetas, explotarReceta, RecetaCiclicaError } from '@/lib/services/recetas';

// Una venta POS descuenta producto o insumos de receta, tanto en línea como al
// ingresar por primera vez una venta local. La retransmisión PAC no repite el consumo.
export async function descontarStockVentaPos(
  empresaId: string,
  ventaId: string,
  items: { productoId: string; cantidad: number }[]
) {
  const recetas = await cargarRecetas(empresaId);
  for (const it of items) {
    try {
      const receta = recetas.get(it.productoId);
      if (receta && receta.descuentaAutomatico && receta.insumos.length > 0) {
        let consumo;
        try {
          consumo = explotarReceta(it.productoId, it.cantidad, recetas);
        } catch (error) {
          if (!(error instanceof RecetaCiclicaError)) throw error;
          console.error(
            `Receta circular en venta POS ${ventaId}, producto ${it.productoId}:`,
            error.message
          );
          continue;
        }
        for (const [insumoId, cantidadExacta] of consumo) {
          const cantidad = Math.round(cantidadExacta);
          if (cantidad <= 0) continue;
          await prisma.producto.updateMany({
            where: { id: insumoId, empresaId, unidadMedida: { not: 'SRV' } },
            data: { stockActual: { decrement: cantidad } },
          });
          await prisma.movimientoInventario.create({
            data: {
              empresaId,
              productoId: insumoId,
              tipo: 'salida',
              cantidad,
              concepto: 'consumo_receta',
              referenciaId: ventaId,
            },
          });
        }
        continue;
      }
      await prisma.producto.updateMany({
        where: { id: it.productoId, empresaId, unidadMedida: { not: 'SRV' } },
        data: { stockActual: { decrement: it.cantidad } },
      });
    } catch (error) {
      console.error(`Error descontando stock producto ${it.productoId} venta ${ventaId}:`, error);
    }
  }
}
