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
        // Design System v2 §7: la paginación es el PIE de la tabla, no una barra suelta
        // debajo. Mismos tokens que CardFooter (Superficie Sutil + borde superior) para que
        // se lea como parte del mismo bloque.
        <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 bg-surface-subtle border-t border-border">
            <div className="flex items-center gap-1 sm:gap-2 text-[11px] sm:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
                <span className="shrink-0">
                    {from}–{to} de {totalCount}
                    <span className="hidden sm:inline"> {entityLabel}</span>
                </span>
                <span className="hidden sm:inline text-muted-foreground">|</span>
                <span className="hidden sm:inline font-semibold text-foreground shrink-0">
                    Página {currentPage} de {pageCount || 1}
                </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
                {onPageSizeChange && (
                    <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
                        <SelectTrigger className="h-8 w-[58px] sm:w-[65px] text-xs px-2">
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
                )}
                <div className="flex items-center gap-1">
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage <= 1}
                        className="sm:w-auto sm:h-8 sm:px-3"
                    >
                        <ChevronLeft className="h-3.5 w-3.5 sm:mr-1 text-muted-foreground" />
                        <span className="hidden sm:inline text-xs font-semibold">Anterior</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage >= pageCount}
                        className="sm:w-auto sm:h-8 sm:px-3"
                    >
                        <span className="hidden sm:inline text-xs font-semibold">Siguiente</span>
                        <ChevronRight className="h-3.5 w-3.5 sm:ml-1 text-muted-foreground" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
