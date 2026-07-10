'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface PaginationBarProps {
    currentPage: number;
    pageCount: number;
    pageSize: number;
    totalCount: number;
    /** Nombre en plural de lo que se está paginando, ej. "productos", "facturas", "clientes". */
    entityLabel: string;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: string) => void;
    pageSizeOptions?: string[];
}

/**
 * Barra de paginación compartida por todas las listas (Productos, Facturas, Clientes,
 * Compras, Pedidos, Cotizaciones, Notas de Entrega, Cuentas por Cobrar, etc.).
 *
 * Antes cada lista tenía su propia copia de este bloque en un solo `flex justify-between`
 * sin envolver, lo que en mobile amontonaba "Mostrando X a Y de Z", el selector de "Filas
 * por página" y los botones "Anterior"/"Siguiente" (con texto) en una sola fila angosta,
 * generando overflow horizontal o texto cortado. Aquí se apila todo en mobile (resumen
 * arriba, controles abajo, repartidos a los extremos) y los botones de navegación se
 * vuelven solo-ícono en mobile (el texto reaparece desde `sm:`).
 */
export function PaginationBar({
    currentPage,
    pageCount,
    pageSize,
    totalCount,
    entityLabel,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = ['10', '20', '50', '100'],
}: PaginationBarProps) {
    const from = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
    const to = Math.min(currentPage * pageSize, totalCount);

    return (
        <div className="flex flex-col gap-3 px-4 py-3 bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-muted-foreground">
                <span>
                    {from}–{to} de {totalCount} {entityLabel}
                </span>
                <span className="hidden sm:inline text-muted-foreground">|</span>
                <span className="font-semibold text-foreground">
                    Página {currentPage} de {pageCount || 1}
                </span>
            </div>

            <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                {onPageSizeChange && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="hidden sm:inline">Filas por página:</span>
                        <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                            <SelectTrigger className="h-8 w-[65px] text-xs rounded-lg">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-lg">
                                {pageSizeOptions.map((opt) => (
                                    <SelectItem key={opt} value={opt} className="text-xs cursor-pointer">
                                        {opt}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="h-8 text-xs font-semibold px-2.5 sm:px-3 border-border rounded-lg"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 sm:mr-1 text-muted-foreground" />
                        <span className="hidden sm:inline">Anterior</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= pageCount}
                        className="h-8 text-xs font-semibold px-2.5 sm:px-3 border-border rounded-lg"
                    >
                        <span className="hidden sm:inline">Siguiente</span>
                        <ChevronRight className="h-3.5 w-3.5 sm:ml-1 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
