import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/auth/context';
import { prisma } from '@/lib/db';
import POSWorkspace from './POSWorkspace';

export const dynamic = 'force-dynamic';

export default async function POSPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { role, empresaId } = await getTenantContext();
  const puedeSalon = ['admin', 'super_admin', 'salonero'].includes(role);
  const puedeMostrador = ['admin', 'super_admin', 'gerente', 'vendedor'].includes(role);
  if (!puedeSalon && !puedeMostrador) redirect('/dashboard');

  const { modo } = await searchParams;
  const mesasConfiguradas =
    puedeSalon && empresaId
      ? await prisma.mesaRestaurante.count({ where: { empresaId, activa: true } })
      : 0;
  const modoInicial =
    role === 'salonero' ||
    (puedeSalon && (modo === 'salon' || (modo !== 'mostrador' && mesasConfiguradas > 0)))
      ? 'salon'
      : 'mostrador';

  return (
    <POSWorkspace
      modoInicial={modoInicial}
      puedeSalon={puedeSalon}
      puedeMostrador={puedeMostrador}
      puedeCerrarZ={role === 'admin' || role === 'super_admin'}
    />
  );
}
