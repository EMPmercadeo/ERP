import { ContentContainer } from '@/components/layout/Content';
import { getCuentasSaldoInactivo, MESES_INACTIVIDAD_DEFECTO } from '@/lib/services/saldoInactivo';
import { CuotasInactivasClient, type CuentaInactivaDTO } from './CuotasInactivasClient';

// El acceso super_admin ya lo impone src/app/admin/layout.tsx (redirige si no es superadmin).
export const dynamic = 'force-dynamic';

export default async function CuotasInactivasPage() {
    const meses = MESES_INACTIVIDAD_DEFECTO;
    const cuentas = await getCuentasSaldoInactivo(meses);

    const dto: CuentaInactivaDTO[] = cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        empresa: c.empresa,
        ruc: c.ruc,
        correo: c.correo,
        saldoFacturas: c.saldoFacturas,
        ultimoConsumo: c.ultimoConsumo ? c.ultimoConsumo.toISOString() : null,
        diasSinConsumir: c.diasSinConsumir,
        notificadoInactividadEn: c.notificadoInactividadEn ? c.notificadoInactividadEn.toISOString() : null,
    }));

    return (
        <ContentContainer className="py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Saldo de facturas inactivo</h1>
                <p className="text-muted-foreground">
                    Clientes con saldo de facturas electrónicas prepago sin consumir por {meses}+ meses.
                    Puedes recordarles por correo o, si lo decides, dar de baja el saldo manualmente
                    (queda registrado en el ledger). El saldo nunca se elimina de forma automática.
                </p>
            </div>

            <CuotasInactivasClient cuentasIniciales={dto} meses={meses} />
        </ContentContainer>
    );
}
