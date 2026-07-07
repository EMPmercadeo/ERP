import { getTenants, getGlobalUsers } from '@/lib/actions/admin';
import { ContentContainer } from '@/components/layout/Content';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, ShieldAlert, Activity } from 'lucide-react';
import { CompanyList } from '@/components/admin/CompanyList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
    const [tenantsData, usersData] = await Promise.all([
        getTenants('', 1, 10),
        getGlobalUsers('', 'all', 'all', 1, 1)
    ]);

    const { companies, totalCount: totalCompanies, pageCount } = tenantsData;
    const { totalCount: totalUsers } = usersData;

    const activeCompanies = companies.filter(c => c.status === 'Activa').length;
    const suspendedCompanies = companies.filter(c => c.status === 'Suspendida').length;

    return (
        <ContentContainer className="py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard Super Admin</h1>
                    <p className="text-muted-foreground">Monitoreo global y gestión multi-tenant de ERP Panamá</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/empresas">
                        <Button variant="outline">Ver Todas las Empresas</Button>
                    </Link>
                    <Link href="/admin/users">
                        <Button variant="outline">Ver Todos los Usuarios</Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Empresas</CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalCompanies}</div>
                        <p className="text-xs text-muted-foreground mt-1">Inquilinos registrados en la plataforma</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1">Usuarios globales activos e inactivos</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empresas Activas</CardTitle>
                        <Activity className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{activeCompanies}</div>
                        <p className="text-xs text-muted-foreground mt-1">Suscripciones en estado activo</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Empresas Suspendidas</CardTitle>
                        <ShieldAlert className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{suspendedCompanies}</div>
                        <p className="text-xs text-muted-foreground mt-1">Suscripciones suspendidas o vencidas</p>
                    </CardContent>
                </Card>
            </div>

            {/* Companies Table */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">Empresas Recientes</h2>
                        <p className="text-sm text-muted-foreground">Listado de inquilinos con acceso rápido a impersonación y administración</p>
                    </div>
                </div>

                <CompanyList
                    initialData={companies}
                    pageCount={pageCount}
                    currentPage={1}
                    pageSize={10}
                    totalCount={totalCompanies}
                    initialSearch=""
                />
            </div>
        </ContentContainer>
    );
}
