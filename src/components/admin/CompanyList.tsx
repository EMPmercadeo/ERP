'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Shield, Power } from 'lucide-react';
import { PaginationBar } from '@/components/ui/pagination-bar';
import { startImpersonation } from '@/lib/actions/impersonate';
import { toggleTenantStatus } from '@/lib/actions/admin';
import Link from 'next/link';
import { toast } from 'sonner';

export interface CompanyData {
    id: string;
    razonSocial: string;
    ruc: string;
    ambiente: string;
    createdAt: Date;
    userCount: number;
    status: string;
}

export function CompanyList({
    initialData,
    pageCount = 1,
    currentPage = 1,
    pageSize = 20,
    totalCount = 0,
    initialSearch = ''
}: {
    initialData: CompanyData[];
    pageCount?: number;
    currentPage?: number;
    pageSize?: number;
    totalCount?: number;
    initialSearch?: string;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [companies, setCompanies] = useState<CompanyData[]>(initialData);

    const createQueryString = useCallback((params: Record<string, string | null>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        for (const [key, value] of Object.entries(params)) {
            if (value === null) {
                newParams.delete(key);
            } else {
                newParams.set(key, value);
            }
        }
        return newParams.toString();
    }, [searchParams]);

    /* eslint-disable react-hooks/exhaustive-deps -- ejecutarse solo cuando cambia searchTerm para evitar loop */
    useEffect(() => {
        const timer = setTimeout(() => {
            const currentSearch = searchParams.get('search') || '';
            if (searchTerm !== currentSearch) {
                const query = createQueryString({ search: searchTerm || null, page: '1' });
                router.push(`${pathname}?${query}`);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);
    /* eslint-enable react-hooks/exhaustive-deps */

    useEffect(() => {
        setCompanies(initialData);
    }, [initialData]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por razón social o RUC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card shadow">
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
                                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
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
                                        <Badge variant={company.status === 'Activa' ? 'success' : 'destructive'}>
                                            {company.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <form action={async () => {
                                                const res = await startImpersonation(company.id);
                                                return res;
                                            }}>
                                                <Button size="icon" variant="ghost" type="submit" className="h-8 w-8 text-warning hover:bg-warning-bg" title="Impersonar" aria-label={`Impersonar empresa ${company.razonSocial}`}>
                                                    <Shield className="h-4 w-4" />
                                                </Button>
                                            </form>
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className={`h-8 w-8 ${company.status === 'Activa' ? 'text-danger hover:bg-danger-bg' : 'text-success hover:bg-success-bg'}`}
                                                title={company.status === 'Activa' ? 'Suspender empresa' : 'Reactivar empresa'}
                                                aria-label={company.status === 'Activa' ? `Suspender empresa ${company.razonSocial}` : `Reactivar empresa ${company.razonSocial}`}
                                                onClick={async () => {
                                                    const res = await toggleTenantStatus(company.id);
                                                    if (res.success) {
                                                        toast.success(`Empresa ${res.newStatus === 'active' ? 'reactivada' : 'suspendida'} exitosamente`);
                                                    } else {
                                                        toast.error(res.error || 'Error al cambiar el estado');
                                                    }
                                                }}
                                            >
                                                <Power className="h-4 w-4" />
                                            </Button>
                                            <Link href={`/admin/empresas/${company.id}`}>
                                                <Button size="icon" variant="ghost" className="h-8 w-8" title="Ver detalles" aria-label={`Ver detalles de la empresa ${company.razonSocial}`}>
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>

                {/* Pagination Controls */}
                <div className="border-t border-border bg-muted/50 rounded-b-lg">
                    <PaginationBar
                        currentPage={currentPage}
                        pageCount={pageCount}
                        pageSize={pageSize}
                        totalCount={totalCount}
                        entityLabel="resultados"
                        onPageChange={(page) => {
                            const query = createQueryString({ page: String(page) });
                            router.push(`${pathname}?${query}`);
                        }}
                        onPageSizeChange={(val) => {
                            const query = createQueryString({ limit: val, page: '1' });
                            router.push(`${pathname}?${query}`);
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
