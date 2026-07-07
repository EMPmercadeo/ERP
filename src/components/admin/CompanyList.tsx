'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { startImpersonation } from '@/lib/actions/impersonate';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por razón social o RUC..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full"
                    />
                </div>
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
                                                <Button size="icon" variant="ghost" type="submit" className="h-8 w-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Impersonar">
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

                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-gray-200 bg-gray-50/50 rounded-b-lg">
                    <div className="text-sm text-muted-foreground">
                        Mostrando <span className="font-medium">{initialData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> a <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> de <span className="font-medium">{totalCount}</span> resultados
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="hidden sm:inline">Filas por página:</span>
                            <Select
                                value={String(pageSize)}
                                onValueChange={(val) => {
                                    const query = createQueryString({ limit: val, page: '1' });
                                    router.push(`${pathname}?${query}`);
                                }}
                            >
                                <SelectTrigger className="h-8 w-[70px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="20">20</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const query = createQueryString({ page: String(currentPage - 1) });
                                    router.push(`${pathname}?${query}`);
                                }}
                                disabled={currentPage <= 1}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Anterior
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    const query = createQueryString({ page: String(currentPage + 1) });
                                    router.push(`${pathname}?${query}`);
                                }}
                                disabled={currentPage >= pageCount || pageCount === 0}
                            >
                                Siguiente
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
