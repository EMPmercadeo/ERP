import { redirect } from 'next/navigation';
import { getTenantContext } from '@/lib/auth/context';
import MesasClient from './MesasClient';

export const dynamic = 'force-dynamic';

export default async function MesasPage() {
  const { role } = await getTenantContext();
  if (!['admin', 'super_admin', 'salonero'].includes(role)) redirect('/dashboard');
  return <MesasClient />;
}
