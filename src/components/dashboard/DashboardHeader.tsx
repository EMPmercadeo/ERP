'use client';

import {
    Calendar,
    Filter,
    Download,
    FileBarChart,
    ChevronDown
} from 'lucide-react';
import { TimeFilter } from './TimeFilter';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

interface DashboardHeaderProps {
    title?: string;
}

export function DashboardHeader({ title = 'Dashboard' }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">
                    Resumen general de tu negocio y estado DGI
                </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Date Filter */}
                <div className="flex items-center">
                    <TimeFilter />
                </div>

                <Separator orientation="vertical" className="hidden h-8 sm:block" />

                {/* Filters */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 gap-2" suppressHydrationWarning>
                                <Filter className="h-4 w-4" />
                                <span className="hidden sm:inline">Filtros</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>Filtrar por</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Sucursal Principal</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Sucursal Este</DropdownMenuCheckboxItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem checked>Caja 1</DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem>Caja 2</DropdownMenuCheckboxItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" className="h-9 gap-2">
                            <Download className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">Exportar</span>
                        </Button>
                        <Button size="sm" className="h-9 gap-2">
                            <FileBarChart className="h-4 w-4" />
                            <span className="sr-only sm:not-sr-only">Reportes</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
