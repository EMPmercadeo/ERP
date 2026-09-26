import { prisma } from '@/lib/db';
import { enviarCorreoSuperadmin } from '@/lib/correo';
import { fechasZVencidas, rangoDiaPanama } from '@/lib/pos/fechaNegocio';

function escapar(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] ?? c
  );
}

async function registrarYEnviar(
  empresaId: string,
  clave: string,
  tipo: string,
  mensaje: string,
  destinatarios: string[]
) {
  const alerta = await prisma.alertaOperativa.upsert({
    where: { empresaId_clave: { empresaId, clave } },
    create: { empresaId, clave, tipo, mensaje },
    update: {},
  });
  if (alerta.enviadaAt || alerta.resueltaAt || !destinatarios.length) return false;
  let todosEnviados = true;
  for (const destinatario of destinatarios) {
    const resultado = await enviarCorreoSuperadmin({
      destinatario,
      asunto: `Alerta operativa: ${tipo === 'mesa' ? 'mesa abierta' : 'cierre Z pendiente'}`,
      cuerpoLibre: `<p>${escapar(mensaje)}</p><p>Ingresa a ERP Panamá para revisar y resolver la alerta.</p>`,
    });
    if (!resultado.success) todosEnviados = false;
  }
  if (todosEnviados)
    await prisma.alertaOperativa.updateMany({
      where: { id: alerta.id, enviadaAt: null, resueltaAt: null },
      data: { enviadaAt: new Date() },
    });
  return todosEnviados;
}

export async function procesarAlertasOperativas(ahora = new Date()) {
  const empresas = await prisma.empresa.findMany({
    where: { OR: [{ turnosCaja: { some: {} } }, { mesasRestaurante: { some: {} } }] },
    select: {
      id: true,
      horaCierreNegocio: true,
      usuarios: { where: { rol: 'admin', activo: true }, select: { email: true } },
    },
  });
  let registradas = 0;
  let correosEnviados = 0;
  for (const empresa of empresas) {
    const destinatarios = empresa.usuarios.map((u) => u.email).filter(Boolean);
    const mesas = await prisma.sesionMesa.findMany({
      where: {
        empresaId: empresa.id,
        estado: 'abierta',
        tipo: 'normal',
        abiertaAt: { lte: new Date(ahora.getTime() - 3 * 60 * 60 * 1000) },
      },
      include: { mesa: { select: { nombre: true } } },
    });
    for (const s of mesas) {
      const clave = `mesa:${s.id}`;
      const mensaje = `La ${s.mesa.nombre} lleva más de 3 horas abierta sin factura pagada.`;
      if (
        !(await prisma.alertaOperativa.findUnique({
          where: { empresaId_clave: { empresaId: empresa.id, clave } },
        }))
      )
        registradas++;
      if (await registrarYEnviar(empresa.id, clave, 'mesa', mensaje, destinatarios))
        correosEnviados++;
    }
    for (const fecha of fechasZVencidas(empresa.horaCierreNegocio, ahora)) {
      const { desde, hasta } = rangoDiaPanama(fecha);
      const [cierre, actividad] = await Promise.all([
        prisma.cierreZDiario.findUnique({
          where: { empresaId_fecha: { empresaId: empresa.id, fecha } },
          select: { id: true },
        }),
        prisma.turnoCaja.count({
          where: { empresaId: empresa.id, fechaApertura: { gte: desde, lt: hasta } },
        }),
      ]);
      if (cierre || !actividad) continue;
      const clave = `z:${fecha}`;
      const mensaje = `Pasó la hora de cierre (${empresa.horaCierreNegocio}, Panamá) y falta registrar el cierre Z del ${fecha}.`;
      if (
        !(await prisma.alertaOperativa.findUnique({
          where: { empresaId_clave: { empresaId: empresa.id, clave } },
        }))
      )
        registradas++;
      if (await registrarYEnviar(empresa.id, clave, 'z', mensaje, destinatarios)) correosEnviados++;
    }
  }
  return { empresas: empresas.length, registradas, correosEnviados };
}
