import { Suspense } from 'react';
import { getTenants } from '@/lib/actions/admin';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ContentContainer } from '@/components/layout/Content';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Shield } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CompaniesPage() {
    const companies = await getTenants();

    return (
        <ContentContainer className="py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
                    <p className="text-muted-foreground">Gestión de cuentas Multi-Tenant</p>
                </div>
                {/* <Button>Nueva Empresa</Button> */}
            </div>

            <div className="rounded-md border bg-white shadow">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Razón Social</TableHead>
                            <TableHead>RUC</TableHead>
                            <TableHead>Ambiente</TableHead>
                            <TableHead>Usuarios</TableHead>
                            <TableHead>Estado</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {companies.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">
                                    No hay empresas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            companies.map((company) => (
                                <TableRow key={company.id}>
                                    <TableCell className="font-medium">{company.razonSocial}</TableCell>
                                    <TableCell>{company.ruc}</TableCell>
                                    <TableCell>
                                        <Badge variant={company.ambiente === 'Producción' ? 'default' : 'secondary'}>
                                            {company.ambiente}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{company.userCount}</TableCell>
                                    <TableCell>
                                        <Badge variant="success">Activa</Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <form action={async () => {
                                                'use server';
                                                const { startImpersonation } = await import('@/lib/actions/impersonate');
                                                await startImpersonation(company.id);
                                            }}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Impersonar">
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                            </form>
                                            <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver detalles">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </ContentContainer>
    );
}
